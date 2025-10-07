<?php
/**
 * Plugin Name: SS Lead Endpoint
 * Description: Secure REST endpoint to accept marketing/feedback/special-offer/financing submissions from Next.js.
 * Version:     4.4.0
 * Author:      SonShine Roofing
 */

if (!defined('ABSPATH')) exit;

/**
 * Constants
 */
if (!defined('SS_LEAD_LOG_DIR')) {
  define('SS_LEAD_LOG_DIR', trailingslashit(WP_CONTENT_DIR) . 'uploads/ss-leads');
}
if (!defined('SS_LEAD_LOG_FILE')) {
  define('SS_LEAD_LOG_FILE', SS_LEAD_LOG_DIR . '/ss-leads.log');
}
if (!defined('SS_LEAD_MAX_RETRIES')) {
  define('SS_LEAD_MAX_RETRIES', 3); // number of scheduled retries after the initial attempt
}
if (!defined('SS_LEAD_RETRY_DELAYS')) {
  define('SS_LEAD_RETRY_DELAYS', [300, 900, 1800]); // seconds
}

add_action('ss_lead_forward_retry', 'ss_lead_handle_scheduled_retry', 10, 1);

/**
 * Ensure logging directory exists.
 */
function ss_lead_ensure_log_dir(): void {
  if (is_dir(SS_LEAD_LOG_DIR)) {
    return;
  }
  wp_mkdir_p(SS_LEAD_LOG_DIR);
}

function ss_lead_redact_value(string $key, $value) {
  if (!is_scalar($value)) {
    return $value;
  }

  $sensitive = ['email', 'phone', 'phoneDisplay', 'firstName', 'lastName', 'address1', 'address2', 'city', 'state', 'zip'];
  if (in_array($key, $sensitive, true)) {
    $string = (string) $value;
    if ($key === 'email') {
      $parts = explode('@', $string);
      $local = substr($parts[0] ?? '', 0, 2);
      $domain = $parts[1] ?? '';
      return $local . '***@' . $domain;
    }
    if ($key === 'phone' || $key === 'phoneDisplay') {
      return '***' . substr($string, -4);
    }
    if ($key === 'zip') {
      return substr($string, 0, 2) . '***';
    }
    return substr($string, 0, 2) . '***';
  }

  return $value;
}

function ss_lead_redact_payload(array $payload): array {
  $redacted = [];
  foreach ($payload as $key => $value) {
    if (is_array($value)) {
      $redacted[$key] = ss_lead_redact_payload($value);
    } else {
      $redacted[$key] = ss_lead_redact_value((string) $key, $value);
    }
  }
  return $redacted;
}

function ss_lead_log(string $message, array $context = []): void {
  if (defined('WP_DEBUG') && !WP_DEBUG) {
    // still log even if debug false; no early return
  }

  ss_lead_ensure_log_dir();
  $record = [
    'timestamp' => gmdate('c'),
    'message'   => $message,
    'context'   => ss_lead_redact_payload($context),
  ];

  $line = wp_json_encode($record) ?: json_encode($record);
  if ($line) {
    file_put_contents(SS_LEAD_LOG_FILE, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
  }
}

function ss_lead_generate_request_id(): string {
  try {
    return bin2hex(random_bytes(8));
  } catch (Exception $e) {
    return strtolower(wp_generate_password(16, false));
  }
}

function ss_lead_queue_storage_key(): string {
  return 'ss_lead_queue';
}

function ss_lead_get_queue(): array {
  $queue = get_option(ss_lead_queue_storage_key(), []);
  return is_array($queue) ? $queue : [];
}

function ss_lead_save_queue(array $queue): void {
  update_option(ss_lead_queue_storage_key(), $queue, false);
}

function ss_lead_schedule_retry(string $item_id, int $attempt): void {
  $delay = SS_LEAD_RETRY_DELAYS[$attempt] ?? end(SS_LEAD_RETRY_DELAYS);
  wp_schedule_single_event(time() + max(60, (int) $delay), 'ss_lead_forward_retry', [$item_id]);
}

function ss_lead_enqueue_retry(string $type, array $payload, string $request_id, string $error): void {
  $queue = ss_lead_get_queue();
  $item_id = $request_id . '_' . uniqid();
  $queue[$item_id] = [
    'id'        => $item_id,
    'requestId' => $request_id,
    'type'      => $type,
    'payload'   => $payload,
    'attempts'  => 0,
    'error'     => $error,
    'createdAt' => current_time('mysql', true),
  ];
  ss_lead_save_queue($queue);
  ss_lead_log('lead_enqueue_retry', [
    'id'       => $item_id,
    'type'     => $type,
    'error'    => $error,
    'payload'  => $payload,
  ]);
  do_action('ss_lead_before_enqueue', $type, $payload, $item_id, $error);
  ss_lead_schedule_retry($item_id, 0);
}

function ss_lead_handle_scheduled_retry(string $item_id): void {
  $queue = ss_lead_get_queue();
  if (empty($queue[$item_id])) {
    return;
  }

  $item = $queue[$item_id];
  $item['attempts'] = (int) ($item['attempts'] ?? 0) + 1;

  $result = ss_lead_dispatch_to_team($item['type'], $item['payload'], $item['requestId'], $item['attempts']);
  if ($result['ok']) {
    unset($queue[$item_id]);
    ss_lead_save_queue($queue);
    ss_lead_log('lead_retry_success', [
      'id'       => $item_id,
      'type'     => $item['type'],
      'attempts' => $item['attempts'],
    ]);
    return;
  }

  if ($item['attempts'] >= SS_LEAD_MAX_RETRIES) {
    unset($queue[$item_id]);
    ss_lead_save_queue($queue);
    ss_lead_log('lead_retry_exhausted', [
      'id'       => $item_id,
      'type'     => $item['type'],
      'attempts' => $item['attempts'],
      'error'    => $result['error'] ?? 'unknown',
    ]);
    ss_lead_notify_failure($item['type'], $item['payload'], $item['requestId'], $result['error'] ?? 'unknown');
    do_action('ss_lead_forward_failed', $item['type'], $item['payload'], $result, $item['attempts']);
    return;
  }

  $queue[$item_id] = $item;
  ss_lead_save_queue($queue);
  ss_lead_log('lead_retry_rescheduled', [
    'id'       => $item_id,
    'type'     => $item['type'],
    'attempts' => $item['attempts'],
    'error'    => $result['error'] ?? 'unknown',
  ]);
  ss_lead_schedule_retry($item_id, $item['attempts']);
}

function ss_lead_notify_failure(string $type, array $payload, string $request_id, string $error): void {
  $to = 'marketing@sonshineroofing.com';
  $subject = sprintf('[Lead Pipeline] Forwarding failed for %s', $type);
  $body = sprintf(
    "Lead forwarding failed after retries.\nType: %s\nRequest ID: %s\nError: %s\nPayload: %s",
    $type,
    $request_id,
    $error,
    wp_json_encode(ss_lead_redact_payload($payload))
  );
  $headers = ['Content-Type: text/plain; charset=UTF-8'];
  wp_mail($to, $subject, $body, $headers);
}

/**
 * Register REST route
 */
add_action('rest_api_init', function () {
  register_rest_route('ss/v1', '/lead', [
    'methods'             => ['POST', 'OPTIONS'],
    'callback'            => 'ss_lead_handler',
    'permission_callback' => '__return_true',
  ]);
});

/**
 * Allowed origins for CORS
 */
function ss_lead_allowed_origins(): array {
  $env = getenv('SS_ALLOWED_ORIGINS');
  if ($env) {
    $parts = array_filter(array_map('trim', explode(',', $env)));
    if (!empty($parts)) return $parts;
  }
  return [
    'https://sonshineroofing.com',
    'https://staging.sonshineroofing.com',
    'http://localhost:3000',
  ];
}

/**
 * Shared secret for all lead types
 */
function ss_lead_secret(): string {
  $env = getenv('SS_LEAD_SECRET');
  if (!empty($env)) return $env;
  if (defined('SS_LEAD_SECRET') && SS_LEAD_SECRET) return SS_LEAD_SECRET;
  return '';
}

/**
 * Zapier endpoint (for leads routed through automation)
 */
function ss_lead_zapier_webhook_url(): string {
  return 'https://hooks.zapier.com/hooks/catch/23362284/u99lt1v/';
}

/**
 * Normalize phone numbers to +1XXXXXXXXXX
 */
function ss_lead_normalize_phone(string $raw): string {
  if ($raw === '') return '';
  if (preg_match('/^\+1\d{10}$/', $raw)) return $raw;

  $digits = preg_replace('/\D+/', '', $raw);
  if (strlen($digits) >= 10) {
    return '+1' . substr($digits, -10);
  }

  return $digits;
}

function ss_lead_format_phone_display(string $raw): string {
  $normalized = ss_lead_normalize_phone($raw);
  if (!preg_match('/^\+1\d{10}$/', $normalized)) {
    return $raw;
  }
  $core = substr($normalized, -10);
  $area = substr($core, 0, 3);
  $mid  = substr($core, 3, 3);
  $last = substr($core, 6);
  return "+1 ({$area}) {$mid}-{$last}";
}

/**
 * Send JSON payload to Zapier
 */
function ss_lead_forward_to_zapier(array $data): array {
  $url = ss_lead_zapier_webhook_url();
  if (!$url) {
    return ['ok' => false, 'error' => 'Zapier webhook missing'];
  }

  $args = [
    'timeout'     => 5,
    'blocking'    => true,
    'redirection' => 1,
    'headers'     => ['Content-Type' => 'application/json'],
    'body'        => wp_json_encode($data),
  ];

  $response = wp_remote_post($url, $args);

  if (is_wp_error($response)) {
    $message = $response->get_error_message();
    error_log('SS Lead Zapier webhook error: ' . $message);
    return ['ok' => false, 'error' => $message];
  }

  $code = wp_remote_retrieve_response_code($response);
  if ($code && $code >= 400) {
    $body = wp_remote_retrieve_body($response);
    error_log('SS Lead Zapier webhook HTTP ' . $code . ': ' . $body);
    return ['ok' => false, 'status' => (int) $code, 'error' => $body];
  }

  return ['ok' => true, 'status' => (int) $code];
}

/**
 * Send CORS headers
 */
function ss_lead_send_cors_headers(\WP_REST_Request $req): void {
  $origin = $req->get_header('origin') ?: '';
  $allowed = ss_lead_allowed_origins();
  $allow_origin = in_array($origin, $allowed, true) ? $origin : $allowed[0];

  header("Access-Control-Allow-Origin: {$allow_origin}");
  header('Vary: Origin');
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: content-type, x-ss-secret');
  header('Access-Control-Max-Age: 600');
}

/**
 * Pick recipient per type (internal notification)
 */
function ss_lead_recipient(string $type): string {
  $envMap = [
    'financing-calculator' => getenv('SS_FINANCING_TO'),
    'feedback'             => getenv('SS_FEEDBACK_TO'),
    'special-offer'        => getenv('SS_SPECIAL_TO'),
    'contact-lead'         => getenv('SS_CONTACT_TO'),
  ];

  $default = 'marketing@sonshineroofing.com';
  $value = $envMap[$type] ?? null;
  if ($value) return sanitize_email($value);

  return $default;
}

/**
 * Apply normalization so downstream always sees +1XXXXXXXXXX
 */
function ss_lead_clean_phone(string $raw): string {
  return ss_lead_normalize_phone($raw);
}

/**
 * Shared track/meta lines
 */
function ss_lead_tracking_lines(array $payload): string {
  $lines = [];

  if (!empty($payload['page'])) {
    $lines[] = '<strong>Page:</strong> ' . esc_html($payload['page']);
  }
  foreach (['utm_source', 'utm_medium', 'utm_campaign'] as $utm) {
    if (!empty($payload[$utm])) {
      $lines[] = sprintf('<strong>%s:</strong> %s', esc_html($utm), esc_html($payload[$utm]));
    }
  }
  if (!empty($payload['ua'])) {
    $lines[] = '<strong>User Agent:</strong> ' . esc_html($payload['ua']);
  }
  if (!empty($payload['tz'])) {
    $lines[] = '<strong>Time Zone:</strong> ' . esc_html($payload['tz']);
  }

  return $lines ? '<p>' . implode('<br/>', $lines) . '</p>' : '';
}

/**
 * Build the customer-facing HTML for special offers
 */
function ss_lead_special_offer_customer_html(string $first, string $offerCode, ?string $expirationDate, ?string $disclaimer = null): string {
  $firstName = $first !== '' ? $first : 'Friend';
  $logo = 'https://next.sonshineroofing.com/wp-content/uploads/cropped-GBP-logo.png';
  $callLink = 'tel:+19418664320';
  $callText = '(941) 866-4320';
  $defaultDisclaimer = 'Offer valid for residential roofing projects only. Cannot be combined with any other discounts or promotions. Must be mentioned at time of scheduling to be applied. Subject to change without notice. Offer expires on the date listed above. Additional terms and conditions may apply.';
  $notice = $disclaimer !== null && $disclaimer !== '' ? $disclaimer : $defaultDisclaimer;
  $address = 'Sonshine Roofing Inc. | 2555 Porter Lake Drive, Ste. 109 | Sarasota, FL 34240 | Florida State Lic. #CCC1331483';

  $socials = [
    ['href' => 'https://www.facebook.com/sonshineroofing',  'domain' => 'facebook.com'],
    ['href' => 'https://www.instagram.com/sonshineroofing', 'domain' => 'instagram.com'],
    ['href' => 'https://www.youtube.com/c/sonshineroofing', 'domain' => 'youtube.com'],
    ['href' => 'https://x.com/ssroofinginc',                'domain' => 'x.com'],
  ];

  $expirationBlock = '';
  if (!empty($expirationDate)) {
    $expirationBlock = sprintf(
      '<p style="margin: 0 0 18px; font-size: 16px; color: #1f2933;">Offer expires on <strong style="color:#0045d7;">%s</strong></p>',
      esc_html($expirationDate)
    );
  }

  $socialLinks = '';
  foreach ($socials as $item) {
    $icon = sprintf('https://www.google.com/s2/favicons?domain=%s&sz=64', rawurlencode($item['domain']));
    $socialLinks .= sprintf(
      '<td style="padding:0 6px;"><a href="%s" style="display:inline-block;"><img src="%s" alt="%s" width="32" height="32" style="display:block; border-radius:4px;" /></a></td>',
      esc_url($item['href']),
      esc_url($icon),
      esc_attr($item['domain'])
    );
  }

  return sprintf(
'<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Special Offer Code</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:\'Helvetica Neue\', Helvetica, Arial, sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="background-color:#f4f6f8; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%%" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(15,23,42,0.12);">
            <tr>
              <td style="padding:32px 24px 0;" align="center">
                <img src="%1$s" alt="SonShine Roofing" width="320" height="auto" style="max-width:320px; width:100%%; height:auto; display:block; margin:0 auto;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 24px; background:linear-gradient(90deg, #0045d7 0%%, #00c5ff 100%%); color:#ffffff; font-size:20px; letter-spacing:0.1em; font-weight:700; text-transform:uppercase;">
                Special Offer Code Below
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 10px; font-size:16px; color:#1f2933; line-height:1.65;">
                <p style="margin:0 0 18px;">Hi <strong>%2$s</strong>,</p>
                <p style="margin:0 0 18px;">Thank you for choosing SonShine Roofing! Your special offer code is below:</p>

                <div style="margin:28px auto 24px; max-width:320px; border:2px dashed #34d399; border-radius:18px; padding:24px 16px; text-align:center; background-color:#ecfdf3;">
                  <p style="margin:0 0 8px; font-size:13px; text-transform:uppercase; letter-spacing:0.2em; color:#059669;">Your Offer Code</p>
                  <p style="margin:0; font-size:36px; font-weight:800; letter-spacing:0.35em; color:#047857;">%3$s</p>
                </div>

                %4$s

                <p style="margin:0 0 18px;">When you call, just mention <strong style="color:#0045d7;">%3$s</strong> and we’ll apply your discount instantly.</p>
                <p style="margin:0 0 24px;"><a href="%5$s" style="color:#0045d7; font-weight:600; text-decoration:none;">Call %6$s</a></p>

                <p style="margin:0 0 18px; font-size:14px; color:#475569; font-style:italic;">Disclaimer: %7$s</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:12px 24px 0;">
                <hr style="border:none; border-top:1px solid #e2e8f0; margin:0 0 16px;" />
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    %8$s
                  </tr>
                </table>
                <p style="margin:16px 0 0; font-size:13px; color:#475569;">%9$s</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 0;"></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>',
    esc_url($logo),
    esc_html($firstName),
    esc_html($offerCode),
    $expirationBlock,
    esc_url($callLink),
    esc_html($callText),
    esc_html($notice),
    $socialLinks,
    esc_html($address)
  );
}

function ss_lead_prepare_notification(string $type, array $payload): array {
  $recipient = ss_lead_recipient($type);
  $fullName = sanitize_text_field($payload['fullName'] ?? trim(($payload['firstName'] ?? '') . ' ' . ($payload['lastName'] ?? '')));
  $email = sanitize_email($payload['email'] ?? '');
  $phoneDisplay = sanitize_text_field($payload['phoneDisplay'] ?? '');
  $trackingPayload = [
    'page'        => esc_url_raw($payload['page'] ?? ''),
    'utm_source'  => sanitize_text_field($payload['utm_source'] ?? ''),
    'utm_medium'  => sanitize_text_field($payload['utm_medium'] ?? ''),
    'utm_campaign'=> sanitize_text_field($payload['utm_campaign'] ?? ''),
    'ua'          => sanitize_text_field($payload['ua'] ?? ''),
    'tz'          => sanitize_text_field($payload['tz'] ?? ''),
  ];

  $baseHeaders = [
    'Content-Type: text/html; charset=UTF-8',
    'From: SonShine Roofing <marketing@sonshineroofing.com>',
  ];
  if ($email) {
    $baseHeaders[] = sprintf('Reply-To: %s <%s>', $fullName !== '' ? $fullName : 'Lead', $email);
  }

  switch ($type) {
    case 'financing-calculator':
      $addr1   = sanitize_text_field($payload['address1'] ?? '');
      $addr2   = sanitize_text_field($payload['address2'] ?? '');
      $city    = sanitize_text_field($payload['city'] ?? '');
      $state   = strtoupper(sanitize_text_field($payload['state'] ?? ''));
      $zip     = sanitize_text_field($payload['zip'] ?? '');
      $amount  = isset($payload['amount']) ? floatval($payload['amount']) : 0;
      $message = trim((string) ($payload['message'] ?? ''));

      if ($addr1 === '' || $city === '' || $state === '' || $zip === '') {
        return ['ok' => false, 'error' => 'Missing address details'];
      }
      if (!preg_match('/^[A-Z]{2}$/', $state)) {
        return ['ok' => false, 'error' => 'Invalid state'];
      }
      if (!preg_match('/^\d{5}$/', $zip)) {
        return ['ok' => false, 'error' => 'Invalid ZIP'];
      }
      if ($amount < 1000) {
        return ['ok' => false, 'error' => 'Invalid amount'];
      }

      $formatted_amount = '$' . number_format(round($amount));
      if ($message === '') {
        $message = sprintf(
          'Financing inquiry from %s for a project estimated at %s.',
          esc_html($fullName),
          esc_html($formatted_amount)
        );
      }

      $summaryLines = [];
      if (!empty($payload['quizSummary']) && is_array($payload['quizSummary'])) {
        $summaryLines[] = '<p><strong>Quiz responses:</strong></p><ul>';
        foreach ($payload['quizSummary'] as $entry) {
          if (is_array($entry)) {
            $summaryLines[] = sprintf(
              '<li>%s — %s</li>',
              esc_html($entry['question'] ?? ''),
              esc_html($entry['answerLabel'] ?? ($entry['answerValue'] ?? ''))
            );
          } else {
            $summaryLines[] = '<li>' . esc_html((string) $entry) . '</li>';
          }
        }
        $summaryLines[] = '</ul>';
      }

      if (!empty($payload['scores'])) {
        $scores = $payload['scores'];
        $summaryLines[] = sprintf(
          '<p><strong>Program Scores:</strong> Service Finance %s%%, YGrene %s%%</p>',
          esc_html((string) ($scores['serviceFinanceScore'] ?? '')),
          esc_html((string) ($scores['ygreneScore'] ?? ''))
        );
        if (!empty($scores['isUncertain'])) {
          $summaryLines[] = '<p><em>Both scores below 50% – follow up recommended.</em></p>';
        }
      }

      if (!empty($payload['match'])) {
        $match = $payload['match'];
        $summaryLines[] = sprintf(
          '<p><strong>Suggested Program:</strong> %s (%s%% match)</p>',
          esc_html($match['label'] ?? $match['program'] ?? ''),
          esc_html((string) ($match['score'] ?? ''))
        );
        if (!empty($match['reasons']) && is_array($match['reasons'])) {
          $summaryLines[] = '<ul>';
          foreach ($match['reasons'] as $reason) {
            $summaryLines[] = '<li>' . esc_html($reason) . '</li>';
          }
          $summaryLines[] = '</ul>';
        }
      }

      $address_html = esc_html(trim("{$addr1} {$addr2}, {$city}, {$state} {$zip}"));
      $trackingLines = ss_lead_tracking_lines($trackingPayload);

      $body = sprintf(
        '<h2>New Financing Inquiry</h2>
         <p><strong>Name:</strong> %1$s<br/>
         <strong>Email:</strong> %2$s<br/>
         <strong>Phone:</strong> %3$s</p>

         <p><strong>Estimate:</strong> %4$s<br/>
         <strong>Address:</strong> %5$s</p>

         <p><strong>Message:</strong><br/>%6$s</p>
         %7$s
         %8$s
         <p><small>Submitted: %9$s</small></p>',
        esc_html($fullName),
        esc_html($email),
        esc_html($phoneDisplay),
        esc_html($formatted_amount),
        $address_html,
        nl2br(esc_html($message)),
        implode('', $summaryLines),
        $trackingLines,
        esc_html(current_time('mysql'))
      );

      $zapierPayload = array_filter([
        'leadType'         => 'financing-calculator',
        'firstName'        => sanitize_text_field($payload['firstName'] ?? ''),
        'lastName'         => sanitize_text_field($payload['lastName'] ?? ''),
        'fullName'         => $fullName,
        'email'            => $email,
        'phone'            => $payload['phone'] ?? '',
        'phoneDisplay'     => $phoneDisplay,
        'address1'         => $addr1,
        'address2'         => $addr2 !== '' ? $addr2 : null,
        'city'             => $city,
        'state'            => $state,
        'zip'              => $zip,
        'amount'           => $amount,
        'amountFormatted'  => $formatted_amount,
        'message'          => wp_strip_all_tags($message),
        'quizSummary'      => !empty($payload['quizSummary']) ? $payload['quizSummary'] : null,
        'scores'           => !empty($payload['scores']) ? $payload['scores'] : null,
        'match'            => !empty($payload['match']) ? $payload['match'] : null,
        'tracking'         => array_filter([
          'page'        => $trackingPayload['page'] ?? null,
          'utmSource'   => $trackingPayload['utm_source'] ?? null,
          'utmMedium'   => $trackingPayload['utm_medium'] ?? null,
          'utmCampaign' => $trackingPayload['utm_campaign'] ?? null,
        ]),
        'timestamp'        => current_time('mysql'),
      ]);

      return [
        'ok'    => true,
        'email' => [
          'to'      => $recipient,
          'subject' => 'Financing Inquiry – Website',
          'body'    => $body,
          'headers' => $baseHeaders,
        ],
        'zapier' => $zapierPayload,
      ];

    case 'contact-lead':
      $projectType = sanitize_text_field($payload['projectType'] ?? '');
      if ($projectType === '') {
        return ['ok' => false, 'error' => 'Project type required'];
      }

      $helpSummary = isset($payload['helpTopics']) ? sanitize_text_field($payload['helpTopics']) : '';
      $timeline    = isset($payload['timeline']) ? sanitize_text_field($payload['timeline']) : '';
      $notes       = isset($payload['notes']) ? sanitize_textarea_field($payload['notes']) : '';

      $addr1 = sanitize_text_field($payload['address1'] ?? '');
      $addr2 = sanitize_text_field($payload['address2'] ?? '');
      $city  = sanitize_text_field($payload['city'] ?? '');
      $state = strtoupper(sanitize_text_field($payload['state'] ?? ''));
      $zip   = sanitize_text_field($payload['zip'] ?? '');

      if ($addr1 === '' || $city === '' || $state === '' || $zip === '') {
        return ['ok' => false, 'error' => 'Missing address details'];
      }
      if (!preg_match('/^[A-Z]{2}$/', $state)) {
        return ['ok' => false, 'error' => 'Invalid state'];
      }
      if (!preg_match('/^\d{5}$/', $zip)) {
        return ['ok' => false, 'error' => 'Invalid ZIP'];
      }

      $preferredContact = sanitize_text_field($payload['preferredContact'] ?? '');
      $bestTime         = sanitize_text_field($payload['bestTime'] ?? '');
      $consentSms       = !empty($payload['consentSms']);
      $contextSummary   = isset($payload['contextSummary']) ? sanitize_text_field($payload['contextSummary']) : '';

      $contextPieces = [];
      if ($notes !== '') {
        $contextPieces[] = 'Note from the customer: ' . $notes . '.';
      }
      if ($bestTime !== '') {
        $contextPieces[] = 'Best time to contact: ' . $bestTime . '.';
      }
      if ($timeline !== '') {
        $contextPieces[] = 'Project timeline: ' . $timeline . '.';
      }
      if ($contextSummary !== '' && empty($contextPieces)) {
        $contextPieces[] = $contextSummary;
      }
      $contextCombined = trim(implode(' ', array_filter($contextPieces)));

      $address_html = esc_html(trim(implode(' ', array_filter([$addr1, $addr2]))) . ", {$city}, {$state} {$zip}");
      $trackingLines = ss_lead_tracking_lines($trackingPayload);

      $body = sprintf(
        '<h2>New Contact Request</h2>
         <p><strong>Name:</strong> %1$s<br/>
         <strong>Email:</strong> %2$s<br/>
         <strong>Phone:</strong> %3$s</p>

         <p><strong>Project Type:</strong> %4$s<br/>
         %5$s
         %6$s
         <strong>Preferred Contact:</strong> %7$s<br/>
         %8$s
         <strong>SMS Opt-In:</strong> %9$s</p>

         <p><strong>Service Address:</strong> %10$s</p>
         %11$s
         %12$s
         <p><small>Submitted: %13$s</small></p>',
        esc_html($fullName),
        esc_html($email),
        esc_html($phoneDisplay),
        esc_html($projectType),
        $helpSummary !== '' ? '<strong>Help Topics:</strong> ' . esc_html($helpSummary) . '<br/>' : '',
        $timeline !== '' ? '<strong>Timeline:</strong> ' . esc_html($timeline) . '<br/>' : '',
        esc_html($preferredContact !== '' ? $preferredContact : 'Not specified'),
        $bestTime !== '' ? '<strong>Best Time:</strong> ' . esc_html($bestTime) . '<br/>' : '',
        $consentSms ? 'Yes' : 'No',
        $address_html,
        $contextCombined !== '' ? '<p>' . esc_html($contextCombined) . '</p>' : '',
        $trackingLines,
        esc_html(current_time('mysql'))
      );

      $zapierPayload = array_filter([
        'leadType'        => 'contact-lead',
        'firstName'       => sanitize_text_field($payload['firstName'] ?? ''),
        'lastName'        => sanitize_text_field($payload['lastName'] ?? ''),
        'fullName'        => $fullName,
        'email'           => $email,
        'phone'           => $payload['phone'] ?? '',
        'phoneDisplay'    => $phoneDisplay,
        'projectType'     => $projectType,
        'helpSummary'     => $helpSummary !== '' ? $helpSummary : null,
        'timeline'        => $timeline !== '' ? $timeline : null,
        'notes'           => $notes !== '' ? wp_strip_all_tags($notes) : null,
        'preferredContact'=> $preferredContact !== '' ? $preferredContact : null,
        'bestTime'        => $bestTime !== '' ? $bestTime : null,
        'consentSms'      => $consentSms ? 'yes' : 'no',
        'address1'        => $addr1,
        'address2'        => $addr2 !== '' ? $addr2 : null,
        'city'            => $city,
        'state'           => $state,
        'zip'             => $zip,
        'contextSummary'  => $contextCombined !== '' ? $contextCombined : null,
        'tracking'        => array_filter([
          'page'        => $trackingPayload['page'] ?? null,
          'utmSource'   => $trackingPayload['utm_source'] ?? null,
          'utmMedium'   => $trackingPayload['utm_medium'] ?? null,
          'utmCampaign' => $trackingPayload['utm_campaign'] ?? null,
        ]),
        'timestamp'       => current_time('mysql'),
      ]);

      return [
        'ok'    => true,
        'email' => [
          'to'      => $recipient,
          'subject' => 'Website Contact Request',
          'body'    => $body,
          'headers' => $baseHeaders,
        ],
        'zapier' => $zapierPayload,
      ];

    case 'feedback':
      $rating  = intval($payload['rating'] ?? 0);
      $message = trim((string) ($payload['message'] ?? ''));

      if ($rating < 1 || $rating > 3) {
        return ['ok' => false, 'error' => 'Invalid rating'];
      }
      if ($message === '') {
        return ['ok' => false, 'error' => 'Message is required'];
      }

      $trackingLines = ss_lead_tracking_lines($trackingPayload);

      $body = sprintf(
        '<h2>New Feedback Submission</h2>
         <p><strong>Name:</strong> %1$s<br/>
         <strong>Email:</strong> %2$s<br/>
         <strong>Phone:</strong> %3$s</p>

         <p><strong>Rating:</strong> %4$s</p>
         <p><strong>Message:</strong><br/>%5$s</p>
         %6$s
         <p><small>Submitted: %7$s</small></p>',
        esc_html($fullName),
        esc_html($email),
        esc_html($phoneDisplay),
        esc_html((string) $rating),
        nl2br(esc_html($message)),
        $trackingLines,
        esc_html(current_time('mysql'))
      );

      return [
        'ok'    => true,
        'email' => [
          'to'      => $recipient,
          'subject' => 'Feedback – Tell Us Why',
          'body'    => $body,
          'headers' => $baseHeaders,
        ],
      ];

    case 'special-offer':
      $offerCode  = sanitize_text_field($payload['offerCode'] ?? '');
      $offerSlug  = sanitize_title($payload['offerSlug'] ?? '');
      $offerTitle = sanitize_text_field($payload['offerTitle'] ?? '');
      $message    = trim((string) ($payload['message'] ?? ''));

      if ($offerCode === '' || $offerSlug === '') {
        return ['ok' => false, 'error' => 'Offer code/slug required'];
      }

      $rawExpiration      = isset($payload['offerExpiration']) ? sanitize_text_field($payload['offerExpiration']) : '';
      $formattedExpiration = isset($payload['offerExpirationLabel']) ? sanitize_text_field($payload['offerExpirationLabel']) : '';
      $expirationLabel     = $formattedExpiration !== '' ? $formattedExpiration : $rawExpiration;
      $legalDisclaimer     = isset($payload['legalDisclaimers']) ? sanitize_text_field($payload['legalDisclaimers']) : null;

      $trackingLines = ss_lead_tracking_lines($trackingPayload);

      $body = sprintf(
        '<h2>New Special Offer Claim</h2>
         <p><strong>Name:</strong> %1$s<br/>
         <strong>Email:</strong> %2$s<br/>
         <strong>Phone:</strong> %3$s</p>

         <p><strong>Offer:</strong> %4$s<br/>
         <strong>Code:</strong> %5$s<br/>
         <strong>Slug:</strong> %6$s</p>
         %7$s
         %8$s
         %9$s
         <p><small>Submitted: %10$s</small></p>',
        esc_html($fullName),
        esc_html($email),
        esc_html($phoneDisplay),
        esc_html($offerTitle !== '' ? $offerTitle : 'Special Offer'),
        esc_html($offerCode),
        esc_html($offerSlug),
        $expirationLabel !== '' ? '<p><strong>Expiration:</strong> ' . esc_html($expirationLabel) . '</p>' : '',
        $message !== '' ? '<p><strong>Message:</strong><br/>' . nl2br(esc_html($message)) . '</p>' : '',
        $trackingLines,
        esc_html(current_time('mysql'))
      );

      $zapierPayload = array_filter([
        'leadType'            => 'special-offer',
        'firstName'           => sanitize_text_field($payload['firstName'] ?? ''),
        'lastName'            => sanitize_text_field($payload['lastName'] ?? ''),
        'fullName'            => $fullName,
        'email'               => $email,
        'phone'               => $payload['phone'] ?? '',
        'phoneDisplay'        => $phoneDisplay,
        'offerCode'           => $offerCode,
        'offerTitle'          => $offerTitle !== '' ? $offerTitle : null,
        'offerSlug'           => $offerSlug,
        'offerExpiration'     => $rawExpiration !== '' ? $rawExpiration : null,
        'offerExpirationLabel'=> $expirationLabel !== '' ? $expirationLabel : null,
        'legalDisclaimer'     => $legalDisclaimer,
        'message'             => wp_strip_all_tags($message),
        'tracking'            => array_filter([
          'page'        => $trackingPayload['page'] ?? null,
          'utmSource'   => $trackingPayload['utm_source'] ?? null,
          'utmMedium'   => $trackingPayload['utm_medium'] ?? null,
          'utmCampaign' => $trackingPayload['utm_campaign'] ?? null,
        ]),
        'timestamp'           => current_time('mysql'),
      ]);

      $customerEmail = null;
      if ($email) {
        $customerEmail = [
          'to'      => $email,
          'subject' => 'Special Offer Discount Code | SonShine Roofing',
          'body'    => ss_lead_special_offer_customer_html(
            sanitize_text_field($payload['firstName'] ?? ''),
            $offerCode,
            $expirationLabel !== '' ? $expirationLabel : null,
            $legalDisclaimer
          ),
          'headers' => ['Content-Type: text/html; charset=UTF-8', 'From: SonShine Roofing <marketing@sonshineroofing.com>'],
        ];
      }

      return [
        'ok'    => true,
        'email' => [
          'to'      => $recipient,
          'subject' => 'Special Offer Claim – Website',
          'body'    => $body,
          'headers' => $baseHeaders,
        ],
        'zapier'         => $zapierPayload,
        'customer_email' => $customerEmail,
      ];
  }

  return ['ok' => false, 'error' => 'Unsupported lead type'];
}

function ss_lead_dispatch_to_team(string $type, array $payload, string $request_id, int $attempt = 0): array {
  $prepared = ss_lead_prepare_notification($type, $payload);
  if (!$prepared['ok']) {
    $errorMessage = $prepared['error'] ?? 'Unknown prepare error';
    ss_lead_log('lead_prepare_failed', [
      'type'      => $type,
      'error'     => $errorMessage,
      'attempt'   => $attempt,
      'requestId' => $request_id,
    ]);
    return ['ok' => false, 'error' => $errorMessage, 'status' => 400, 'stage' => 'prepare'];
  }

  $prepared = apply_filters('ss_lead_prepared_notification', $prepared, $type, $payload, $request_id, $attempt);
  do_action('ss_lead_before_forward', $type, $prepared, $payload, $request_id, $attempt);

  $email = $prepared['email'];
  $to = $email['to'];
  $subject = $email['subject'];
  $body = $email['body'];
  $headers = $email['headers'] ?? [];

  $sent = wp_mail($to, $subject, $body, $headers);
  if (!$sent) {
    ss_lead_log('lead_internal_send_failed', [
      'type'      => $type,
      'requestId' => $request_id,
      'subject'   => $subject,
      'attempt'   => $attempt,
    ]);
    return ['ok' => false, 'error' => 'Internal notification send failed', 'status' => 502, 'stage' => 'email'];
  }

  if (!empty($prepared['customer_email']) && is_array($prepared['customer_email'])) {
    $customer = $prepared['customer_email'];
    wp_mail($customer['to'], $customer['subject'], $customer['body'], $customer['headers'] ?? []);
  }

  $zapierResult = null;
  if (!empty($prepared['zapier']) && is_array($prepared['zapier'])) {
    $zapierResult = ss_lead_forward_to_zapier($prepared['zapier']);
    if (empty($zapierResult['ok'])) {
      ss_lead_log('lead_zapier_failed', [
        'type'      => $type,
        'requestId' => $request_id,
        'error'     => $zapierResult['error'] ?? 'unknown',
        'status'    => $zapierResult['status'] ?? null,
        'attempt'   => $attempt,
      ]);
      return [
        'ok'     => false,
        'error'  => $zapierResult['error'] ?? 'Zapier forwarding failed',
        'status' => $zapierResult['status'] ?? 502,
        'stage'  => 'zapier',
      ];
    }
  }

  ss_lead_log('lead_forward_success', [
    'type'      => $type,
    'requestId' => $request_id,
    'attempt'   => $attempt,
    'zapier'    => (array) $zapierResult,
  ]);
  do_action('ss_lead_after_forward', $type, $payload, ['ok' => true, 'zapier' => $zapierResult], $attempt);

  return ['ok' => true, 'status' => 200, 'stage' => 'complete'];
}

/**
 * Main handler
 */
function ss_lead_handler(\WP_REST_Request $req) {
  ss_lead_send_cors_headers($req);

  if ($req->get_method() === 'OPTIONS') {
    return new \WP_REST_Response(null, 204);
  }

  if (!is_ssl()) {
    return new \WP_REST_Response(['ok' => false, 'error' => 'HTTPS required'], 400);
  }

  $request_id = ss_lead_generate_request_id();

  $payload = $req->get_json_params();
  if (!is_array($payload)) {
    return new \WP_REST_Response(['ok' => false, 'error' => 'Invalid JSON'], 400);
  }

  $type = sanitize_key($payload['type'] ?? '');
  if (!$type) {
    return new \WP_REST_Response(['ok' => false, 'error' => 'Missing lead type'], 400);
  }

  $provided = $req->get_header('x-ss-secret') ?: '';
  $expected = ss_lead_secret();
  if (!$expected || $provided !== $expected) {
    ss_lead_log('lead_auth_failed', ['requestId' => $request_id, 'type' => $type]);
    return new \WP_REST_Response(['ok' => false, 'error' => 'Unauthorized'], 401);
  }

  $first = sanitize_text_field($payload['firstName'] ?? '');
  $last  = sanitize_text_field($payload['lastName'] ?? '');
  $name  = trim($first . ' ' . $last);
  $email = sanitize_email($payload['email'] ?? '');
  $rawPhone = $payload['phone'] ?? '';
  $phone = ss_lead_clean_phone(is_string($rawPhone) ? $rawPhone : '');
  $phoneDisplay = '';
  if (!empty($payload['phoneDisplay'])) {
    $phoneDisplay = sanitize_text_field($payload['phoneDisplay']);
  }
  if ($phoneDisplay === '') {
    $phoneDisplay = ss_lead_format_phone_display($phone ?: (is_string($rawPhone) ? $rawPhone : ''));
  }
  $page  = esc_url_raw($payload['page'] ?? '');

  if ($first === '' || $last === '') {
    return new \WP_REST_Response(['ok' => false, 'error' => 'Name is required'], 400);
  }
  if (!is_email($email)) {
    return new \WP_REST_Response(['ok' => false, 'error' => 'Invalid email'], 400);
  }
  if (!preg_match('/^\+1\d{10}$/', $phone)) {
    return new \WP_REST_Response(['ok' => false, 'error' => 'Invalid phone'], 400);
  }

  $normalized = array_merge($payload, [
    'type'         => $type,
    'firstName'    => $first,
    'lastName'     => $last,
    'fullName'     => $name,
    'email'        => $email,
    'phone'        => $phone,
    'phoneDisplay' => $phoneDisplay,
    'page'         => $page,
    'utm_source'   => sanitize_text_field($payload['utm_source'] ?? ''),
    'utm_medium'   => sanitize_text_field($payload['utm_medium'] ?? ''),
    'utm_campaign' => sanitize_text_field($payload['utm_campaign'] ?? ''),
    'ua'           => sanitize_text_field($payload['ua'] ?? ''),
    'tz'           => sanitize_text_field($payload['tz'] ?? ''),
    'consentSms'   => !empty($payload['consentSms']),
  ]);

  ss_lead_log('lead_received', [
    'requestId' => $request_id,
    'type'      => $type,
    'page'      => $page,
    'utm'       => [
      'source'   => $normalized['utm_source'],
      'medium'   => $normalized['utm_medium'],
      'campaign' => $normalized['utm_campaign'],
    ],
  ]);

  do_action('ss_lead_received', $type, $normalized, $request_id, $req);
  do_action('ss_lead_before_dispatch', $type, $normalized, $request_id);

  $result = ss_lead_dispatch_to_team($type, $normalized, $request_id, 0);

  if (!empty($result['ok'])) {
    return new \WP_REST_Response(['ok' => true, 'requestId' => $request_id], 200);
  }

  if (($result['stage'] ?? '') === 'prepare') {
    return new \WP_REST_Response([
      'ok'    => false,
      'error' => $result['error'] ?? 'Validation failed',
    ], $result['status'] ?? 400);
  }

  $errorMessage = $result['error'] ?? 'Upstream forwarding failed';
  ss_lead_log('lead_queue_after_failure', [
    'requestId' => $request_id,
    'type'      => $type,
    'stage'     => $result['stage'] ?? 'unknown',
    'error'     => $errorMessage,
  ]);
  ss_lead_enqueue_retry($type, $normalized, $request_id, $errorMessage);
  do_action('ss_lead_forward_failed', $type, $normalized, $result, 0);

  return new \WP_REST_Response([
    'ok'        => true,
    'queued'    => true,
    'requestId' => $request_id,
  ], 200);
}

