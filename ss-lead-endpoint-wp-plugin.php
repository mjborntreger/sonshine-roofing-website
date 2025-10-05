<?php
/**
 * Plugin Name: SonShine Lead Endpoint (Prototype)
 * Description: Prototype plugin to manage SonShine Roofing lead email templates via WordPress admin.
 * Version:     0.1.0
 * Author:      SonShine Roofing
 * License:     GPL-2.0-or-later
 */

if (! defined('ABSPATH')) {
    exit;
}

final class SS_Lead_Endpoint_Plugin {
    const CAPABILITY             = 'manage_ss_lead_templates';
    const OPTION_DEFAULTS_KEY    = 'ss_lead_template_defaults';
    const AJAX_NONCE_ACTION      = 'ss_lead_template_tools';

    public function __construct() {
        add_action('admin_init', [$this, 'ensure_capabilities']);
        add_action('add_meta_boxes', [$this, 'register_metabox']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('wp_ajax_ss_lead_preview_template', [$this, 'handle_ajax_preview']);
        add_action('wp_ajax_ss_lead_send_test_template', [$this, 'handle_ajax_send_test']);

        // Placeholder for future REST endpoint registration.
        add_action('rest_api_init', function () {
            // TODO: Register REST routes when ready to replace MU endpoint.
        });
    }

    public static function activate(): void {
        $role = get_role('administrator');
        if ($role && ! $role->has_cap(self::CAPABILITY)) {
            $role->add_cap(self::CAPABILITY);
        }

        if (! get_option(self::OPTION_DEFAULTS_KEY)) {
            update_option(self::OPTION_DEFAULTS_KEY, [
                'recipient_to'  => [],
                'recipient_cc'  => [],
                'recipient_bcc' => [],
                'reply_to'      => '',
            ]);
        }
    }

    public static function deactivate(): void {
        // Intentionally left empty. We keep capabilities/options intact.
    }

    public function ensure_capabilities(): void {
        if (! is_user_logged_in() || ! current_user_can('administrator')) {
            return;
        }

        $role = get_role('administrator');
        if ($role && ! $role->has_cap(self::CAPABILITY)) {
            $role->add_cap(self::CAPABILITY);
        }
    }

    public function register_metabox(): void {
        $screen = get_current_screen();
        if (! $screen || $screen->post_type !== 'email-template') {
            return;
        }

        add_meta_box(
            'ss_lead_template_tools',
            __('Template Tools', 'ss-lead'),
            [$this, 'render_tools_metabox'],
            'email-template',
            'side',
            'high'
        );
    }

    public function render_tools_metabox($post): void {
        if (! current_user_can(self::CAPABILITY)) {
            echo '<p>' . esc_html__('You do not have permission to use these tools.', 'ss-lead') . '</p>';
            return;
        }

        wp_nonce_field(self::AJAX_NONCE_ACTION, '_ss_lead_nonce');

        $last_test = get_field('last_test_recipient', $post->ID);
        $last_test = is_string($last_test) ? $last_test : '';
        ?>
        <p>
            <button type="button" class="button button-secondary" id="ss-lead-preview-button" data-post="<?php echo esc_attr($post->ID); ?>">
                <?php esc_html_e('Preview Email', 'ss-lead'); ?>
            </button>
        </p>
        <p>
            <label for="ss-lead-test-recipient" style="display:block; font-weight:600;">
                <?php esc_html_e('Test recipient', 'ss-lead'); ?>
            </label>
            <input type="email" class="widefat" id="ss-lead-test-recipient" value="<?php echo esc_attr($last_test); ?>" placeholder="name@example.com" />
        </p>
        <p>
            <button type="button" class="button button-primary" id="ss-lead-send-test" data-post="<?php echo esc_attr($post->ID); ?>">
                <?php esc_html_e('Send Test Email', 'ss-lead'); ?>
            </button>
        </p>
        <div id="ss-lead-preview-overlay" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.55); z-index:100000; align-items:center; justify-content:center;">
            <div id="ss-lead-preview-dialog" role="dialog" aria-modal="true" aria-label="<?php esc_attr_e('Email preview', 'ss-lead'); ?>" style="width:92vw; max-width:920px; background:#0f172a; border-radius:12px; overflow:hidden; box-shadow:0 24px 60px rgba(15,23,42,0.45); display:flex; flex-direction:column;">
                <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 18px; background:#0f172a; color:#ffffff;">
                    <h2 style="margin:0; font-size:16px; font-weight:600; letter-spacing:0.02em;">
                        <?php esc_html_e('Email Preview', 'ss-lead'); ?>
                    </h2>
                    <button type="button" id="ss-lead-preview-close" aria-label="<?php esc_attr_e('Close preview', 'ss-lead'); ?>" style="background:none; border:none; color:#ffffff; cursor:pointer; font-size:20px; line-height:1;">×</button>
                </div>
                <div id="ss-lead-preview-body" style="background:#f8fafc; flex:1 1 auto; max-height:80vh; overflow:auto; padding:24px;">
                    <div id="ss-lead-preview-loading" style="padding:18px; font-size:14px; color:#0f172a;">
                        <?php esc_html_e('Rendering preview…', 'ss-lead'); ?>
                    </div>
                    <iframe id="ss-lead-preview-frame" title="<?php esc_attr_e('Email preview frame', 'ss-lead'); ?>" style="width:100%; border:none; display:none; background:#f4f6f8;"></iframe>
                </div>
            </div>
        </div>
        <?php
    }

    public function enqueue_admin_assets($hook): void {
        if (! current_user_can(self::CAPABILITY)) {
            return;
        }

        $screen = get_current_screen();
        if (! $screen || $screen->post_type !== 'email-template') {
            return;
        }

        wp_enqueue_script('jquery');
        wp_enqueue_script('wp-util');

        // Optional CodeMirror support for template body textarea.
        $settings = wp_enqueue_code_editor([
            'type' => 'text/html',
        ]);
        if (! empty($settings)) {
            wp_add_inline_script(
                'code-editor',
                'jQuery(function($){
                    $("textarea[name=template_body]").each(function(){
                        wp.codeEditor.initialize(this, ' . wp_json_encode($settings) . ');
                    });
                });'
            );
        }

        wp_register_script('ss-lead-template-admin', '', [], false, true);

        $adminScript = <<<'JS'
jQuery(function($){
    var nonce = $("#_ss_lead_nonce").val();
    var $overlay = $("#ss-lead-preview-overlay");
    var $dialog = $("#ss-lead-preview-dialog");
    var $frame = $("#ss-lead-preview-frame");
    var $loading = $("#ss-lead-preview-loading");

    if (! document.getElementById("ss-lead-preview-style")) {
        $("head").append("<style id=\"ss-lead-preview-style\">body.ss-lead-preview-open{overflow:hidden;}#ss-lead-preview-frame{min-height:60vh;}#ss-lead-preview-body::-webkit-scrollbar{width:8px;}#ss-lead-preview-body::-webkit-scrollbar-thumb{background:#cbd5f5;border-radius:4px;}</style>");
    }

    function trapFocus() {
        var focusable = $dialog.find("a, button, input, textarea, iframe").filter(":visible");
        if (focusable.length) {
            focusable.first().focus();
        }
    }

    function openModal() {
        $overlay.fadeIn(120, trapFocus);
        $("body").addClass("ss-lead-preview-open");
        $(document).on("keydown.ssLeadPreview", function(evt){
            if (evt.key === "Escape") {
                closeModal();
            }
        });
    }

    function resetFrame() {
        if (! $frame[0]) {
            return;
        }
        try {
            if ("srcdoc" in $frame[0]) {
                $frame[0].srcdoc = "";
            } else if ($frame[0].contentDocument) {
                $frame[0].contentDocument.open();
                $frame[0].contentDocument.write("");
                $frame[0].contentDocument.close();
            }
        } catch (e) {}
    }

    function closeModal() {
        $overlay.fadeOut(120, function(){
            $loading.show();
            $frame.hide();
            resetFrame();
        });
        $("body").removeClass("ss-lead-preview-open");
        $(document).off("keydown.ssLeadPreview");
    }

    $("#ss-lead-preview-close").on("click", closeModal);
    $overlay.on("click", function(evt){
        if (evt.target === $overlay[0]) {
            closeModal();
        }
    });

    $("#ss-lead-preview-button").on("click", function(){
        var postId = $(this).data("post");
        openModal();
        resetFrame();
        $loading.show();
        $frame.hide();

        wp.ajax.post("ss_lead_preview_template", {
            _ss_lead_nonce: nonce,
            post_id: postId
        }).done(function(resp){
            var html = resp && resp.html ? resp.html : ssLeadTemplateAdmin.emptyText;
            if ($frame[0]) {
                try {
                    if ("srcdoc" in $frame[0]) {
                        $frame[0].srcdoc = html;
                    } else if ($frame[0].contentDocument) {
                        $frame[0].contentDocument.open();
                        $frame[0].contentDocument.write(html);
                        $frame[0].contentDocument.close();
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            $loading.hide();
            $frame.show();
        }).fail(function(error){
            var message = error && error.message ? error.message : ssLeadTemplateAdmin.errorText;
            $loading.hide();
            $frame.hide();
            alert(message);
            closeModal();
        });
    });

    $("#ss-lead-send-test").on("click", function(){
        var postId = $(this).data("post");
        var email = $("#ss-lead-test-recipient").val();
        if (! email) {
            alert(ssLeadTemplateAdmin.testPrompt);
            return;
        }
        var button = $(this);
        button.prop("disabled", true).text(ssLeadTemplateAdmin.sendingText);
        wp.ajax.post("ss_lead_send_test_template", {
            _ss_lead_nonce: nonce,
            post_id: postId,
            test_recipient: email
        }).done(function(resp){
            alert(resp && resp.message ? resp.message : ssLeadTemplateAdmin.successText);
        }).fail(function(error){
            var message = error && error.message ? error.message : ssLeadTemplateAdmin.errorText;
            alert(message);
        }).always(function(){
            button.prop("disabled", false).text(ssLeadTemplateAdmin.sendTestText);
        });
    });
});
JS;

        wp_add_inline_script('ss-lead-template-admin', $adminScript);

        wp_localize_script('ss-lead-template-admin', 'ssLeadTemplateAdmin', [
            'loadingText'  => __('Rendering preview…', 'ss-lead'),
            'emptyText'    => __('No preview available.', 'ss-lead'),
            'errorText'    => __('Something went wrong. Please try again.', 'ss-lead'),
            'previewTitle' => __('Email Preview', 'ss-lead'),
            'testPrompt'   => __('Enter a test recipient email address.', 'ss-lead'),
            'sendingText'  => __('Sending…', 'ss-lead'),
            'successText'  => __('Test email sent.', 'ss-lead'),
            'sendTestText' => __('Send Test Email', 'ss-lead'),
        ]);
        wp_enqueue_script('ss-lead-template-admin');
    }

    private function verify_ajax_permissions(): void {
        if (! current_user_can(self::CAPABILITY)) {
            wp_send_json_error(['message' => __('You do not have permission to perform this action.', 'ss-lead')], 403);
        }
        check_ajax_referer(self::AJAX_NONCE_ACTION, '_ss_lead_nonce');
    }

    public function handle_ajax_preview(): void {
        $this->verify_ajax_permissions();

        $post_id = isset($_POST['post_id']) ? absint($_POST['post_id']) : 0;
        if (! $post_id || get_post_type($post_id) !== 'email-template') {
            wp_send_json_error(['message' => __('Unknown template.', 'ss-lead')], 400);
        }

        if (! function_exists('get_field')) {
            wp_send_json_error(['message' => __('Advanced Custom Fields is required for previews.', 'ss-lead')]);
        }

        $template = SS_Lead_Templates::get_template_from_post($post_id);
        if (! $template) {
            wp_send_json_error(['message' => __('Template could not be loaded.', 'ss-lead')], 400);
        }

        $data   = $template['default_preview'];
        $errors = [];
        $html   = SS_Lead_Renderer::render_body($template, $data, $errors);

        if (! empty($errors)) {
            $html = '<div class="notice notice-warning"><p>' . esc_html__('Template rendered with warnings:', 'ss-lead') . '</p><ul>';
            foreach ($errors as $warning) {
                $html .= '<li>' . esc_html($warning) . '</li>';
            }
            $html .= '</ul></div>' . $html;
        }

        wp_send_json_success([
            'html' => $html,
        ]);
    }

    public function handle_ajax_send_test(): void {
        $this->verify_ajax_permissions();

        $post_id = isset($_POST['post_id']) ? absint($_POST['post_id']) : 0;
        if (! $post_id || get_post_type($post_id) !== 'email-template') {
            wp_send_json_error(['message' => __('Unknown template.', 'ss-lead')], 400);
        }

        $recipient = isset($_POST['test_recipient']) ? sanitize_email(wp_unslash($_POST['test_recipient'])) : '';
        if (! $recipient || ! is_email($recipient)) {
            wp_send_json_error(['message' => __('Please provide a valid email address.', 'ss-lead')], 400);
        }

        if (! function_exists('get_field')) {
            wp_send_json_error(['message' => __('Advanced Custom Fields is required for this action.', 'ss-lead')]);
        }

        $template = SS_Lead_Templates::get_template_from_post($post_id);
        if (! $template) {
            wp_send_json_error(['message' => __('Template could not be loaded.', 'ss-lead')], 400);
        }

        $data   = $template['default_preview'];
        $errors = [];
        $subject = SS_Lead_Renderer::render_subject($template, $data, $errors);
        $body    = SS_Lead_Renderer::render_body($template, $data, $errors);

        $mailer = new SS_Lead_Mailer();
        $sent   = $mailer->send_test($recipient, $subject, $body, $template);

        if ($sent) {
            if (function_exists('update_field')) {
                update_field('last_test_recipient', $recipient, $post_id);
            }
            $message = __('Test email sent successfully.', 'ss-lead');
            if (! empty($errors)) {
                $message .= ' ' . __('Warnings: ', 'ss-lead') . implode('; ', $errors);
            }
            wp_send_json_success(['message' => $message]);
        }

        wp_send_json_error(['message' => __('Test email failed to send. Check logs for details.', 'ss-lead')], 500);
    }
}

class SS_Lead_Templates {
    public static function get_template_from_post(int $post_id): ?array {
        $post = get_post($post_id);
        if (! $post || $post->post_type !== 'email-template') {
            return null;
        }

        if (! function_exists('get_field')) {
            return null;
        }

        $subject     = (string) get_field('template_subject', $post_id);
        $body        = (string) get_field('template_body', $post_id);
        $description = (string) get_field('template_description', $post_id);
        $enabled     = (bool) get_field('template_enabled', $post_id);
        $reply_to    = (string) get_field('reply_to', $post_id);
        $defaultData = self::decode_preview_data(get_field('default_data_preview', $post_id));

        $allowed     = self::normalize_allowed_tokens(get_field('allowed_tokens', $post_id));
        $recipients  = [
            'to'  => self::normalize_recipients(get_field('recipient_to', $post_id)),
            'cc'  => self::normalize_recipients(get_field('recipient_cc', $post_id)),
            'bcc' => self::normalize_recipients(get_field('recipient_bcc', $post_id)),
        ];

        if (empty($recipients['to'])) {
            $defaults             = SS_Lead_Templates::get_global_defaults();
            $recipients['to']     = $defaults['recipient_to'];
            $recipients['cc']     = $recipients['cc'] ?: $defaults['recipient_cc'];
            $recipients['bcc']    = $recipients['bcc'] ?: $defaults['recipient_bcc'];
            $reply_to             = $reply_to ?: $defaults['reply_to'];
        }

        return [
            'ID'               => $post_id,
            'title'            => get_the_title($post_id),
            'slug'             => $post->post_name,
            'subject'          => $subject,
            'body'             => $body,
            'description'      => $description,
            'enabled'          => $enabled,
            'reply_to'         => $reply_to,
            'recipients'       => $recipients,
            'allowed_tokens'   => $allowed,
            'default_preview'  => $defaultData,
        ];
    }

    public static function get_template_by_slug(string $slug): ?array {
        $query = new WP_Query([
            'post_type'      => 'email-template',
            'post_status'    => 'publish',
            'name'           => $slug,
            'posts_per_page' => 1,
            'no_found_rows'  => true,
        ]);

        if (! $query->have_posts()) {
            return null;
        }

        $post = $query->posts[0];
        return self::get_template_from_post($post->ID);
    }

    public static function get_global_defaults(): array {
        $defaults = get_option(SS_Lead_Endpoint_Plugin::OPTION_DEFAULTS_KEY, []);
        return wp_parse_args($defaults, [
            'recipient_to'  => [],
            'recipient_cc'  => [],
            'recipient_bcc' => [],
            'reply_to'      => '',
        ]);
    }

    private static function decode_preview_data($value): array {
        if (is_array($value)) {
            return $value;
        }

        if (! is_string($value) || $value === '') {
            return [];
        }

        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        return [];
    }

    private static function normalize_recipients($value): array {
        $emails = [];

        if (is_array($value)) {
            foreach ($value as $entry) {
                if (is_array($entry)) {
                    foreach ($entry as $maybe) {
                        if (is_string($maybe)) {
                            $emails = array_merge($emails, self::split_emails($maybe));
                        }
                    }
                } elseif (is_string($entry)) {
                    $emails = array_merge($emails, self::split_emails($entry));
                }
            }
        } elseif (is_string($value)) {
            $emails = array_merge($emails, self::split_emails($value));
        }

        $emails = array_unique(array_filter(array_map('sanitize_email', $emails)));
        return array_values(array_filter($emails, 'is_email'));
    }

    private static function split_emails(string $value): array {
        $parts = preg_split('/[\s,;]+/', $value);
        return array_filter(array_map('trim', $parts));
    }

    private static function normalize_allowed_tokens($value): array {
        if (empty($value)) {
            return [];
        }

        $tokens = [];
        if (is_array($value)) {
            foreach ($value as $entry) {
                if (is_string($entry)) {
                    $tokens[] = $entry;
                } elseif (is_array($entry)) {
                    foreach ($entry as $maybe) {
                        if (is_string($maybe)) {
                            $tokens[] = $maybe;
                            break;
                        }
                    }
                }
            }
        } elseif (is_string($value)) {
            $tokens[] = $value;
        }

        $tokens = array_unique(array_map(function ($token) {
            $token = trim($token);
            $token = preg_replace('/[^A-Za-z0-9_\-\.]/', '', $token);
            return $token;
        }, array_filter($tokens)));

        return array_values($tokens);
    }
}

class SS_Lead_Renderer {
    public static function render_subject(array $template, array $data, array &$warnings): string {
        return self::replace_tokens($template['subject'], $data, $template['allowed_tokens'], $warnings);
    }

    public static function render_body(array $template, array $data, array &$warnings): string {
        return self::replace_tokens($template['body'], $data, $template['allowed_tokens'], $warnings);
    }

    private static function replace_tokens(string $content, array $data, array $allowed, array &$warnings): string {
        if ($content === '') {
            return '';
        }

        preg_match_all('/{{\s*([A-Za-z0-9_\.\-]+)\s*}}/', $content, $matches);
        $tokensInTemplate = $matches[1] ?? [];

        $allowedLookup = array_flip($allowed);
        $replacements  = [];

        foreach (array_unique($tokensInTemplate) as $token) {
            if (! isset($allowedLookup[$token])) {
                $warnings[] = sprintf(__('Token "%s" is not in the allowed list.', 'ss-lead'), $token);
            }

            $value = self::extract_value($data, $token);
            if ($value === null) {
                $warnings[] = sprintf(__('Token "%s" has no value in preview data.', 'ss-lead'), $token);
                $value = '';
            }

            $replacements['{{' . $token . '}}'] = $value;
            $replacements['{{ ' . $token . ' }}'] = $value;
        }

        if (! empty($replacements)) {
            $content = strtr($content, $replacements);
        }

        return $content;
    }

    private static function extract_value(array $data, string $token) {
        if (array_key_exists($token, $data)) {
            return is_scalar($data[$token]) ? (string) $data[$token] : '';
        }

        // Support dot notation e.g. user.name
        if (strpos($token, '.') !== false) {
            $segments = explode('.', $token);
            $current  = $data;
            foreach ($segments as $segment) {
                if (! is_array($current) || ! array_key_exists($segment, $current)) {
                    return null;
                }
                $current = $current[$segment];
            }
            return is_scalar($current) ? (string) $current : '';
        }

        return null;
    }
}

class SS_Lead_Mailer {
    public function send_test(string $recipient, string $subject, string $body, array $template): bool {
        $headers = ['Content-Type: text/html; charset=UTF-8'];
        if (! empty($template['reply_to']) && is_email($template['reply_to'])) {
            $headers[] = 'Reply-To: ' . sanitize_email($template['reply_to']);
        }

        return wp_mail($recipient, $subject, $body, $headers);
    }

    public function send_live(array $template, array $data): bool {
        $warnings = [];
        $subject  = SS_Lead_Renderer::render_subject($template, $data, $warnings);
        $body     = SS_Lead_Renderer::render_body($template, $data, $warnings);

        $headers = ['Content-Type: text/html; charset=UTF-8'];
        if (! empty($template['reply_to']) && is_email($template['reply_to'])) {
            $headers[] = 'Reply-To: ' . sanitize_email($template['reply_to']);
        }

        $to = $template['recipients']['to'];
        if (empty($to)) {
            error_log('SS_Lead_Mailer: no primary recipients defined for template ' . $template['slug']);
            return false;
        }

        $additionalHeaders = $headers;
        if (! empty($template['recipients']['cc'])) {
            $additionalHeaders[] = 'Cc: ' . implode(',', $template['recipients']['cc']);
        }
        if (! empty($template['recipients']['bcc'])) {
            $additionalHeaders[] = 'Bcc: ' . implode(',', $template['recipients']['bcc']);
        }

        $sent = wp_mail($to, $subject, $body, $additionalHeaders);
        if (! $sent) {
            error_log('SS_Lead_Mailer: wp_mail failed for template ' . $template['slug']);
        }

        if (! empty($warnings)) {
            error_log('SS_Lead_Mailer warnings (' . $template['slug'] . '): ' . implode(' | ', $warnings));
        }

        return $sent;
    }
}

register_activation_hook(__FILE__, ['SS_Lead_Endpoint_Plugin', 'activate']);
register_deactivation_hook(__FILE__, ['SS_Lead_Endpoint_Plugin', 'deactivate']);

add_action('plugins_loaded', function () {
    if (! class_exists('acf')) {
        // We rely on ACF for template fields; log notice but keep plugin running.
        add_action('admin_notices', function () {
            echo '<div class="notice notice-warning"><p>' . esc_html__('SonShine Lead Endpoint: Advanced Custom Fields is required for full functionality.', 'ss-lead') . '</p></div>';
        });
    }

    new SS_Lead_Endpoint_Plugin();
});
