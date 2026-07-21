<?php
/**
 * Plugin Name: SonShine Headless Cleanup (Draft Dark Theme)
 * Description: Opinionated admin + front-end cleanup for a headless WordPress with a dark workspace theme.
 *
 * NOTE: This file is a draft prototype of the dark mode/admin polish updates discussed with Codex.
 *       Copy the relevant sections into your live MU plugin when you're ready.
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('HEADLESS_FRONTEND_ORIGIN')) {
    define('HEADLESS_FRONTEND_ORIGIN', 'https://sonshineroofing.com');
}

add_action('template_redirect', function () {
    if (is_admin() || php_sapi_name() === 'cli') {
        return;
    }

    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    $allow_prefixes = [
        '/graphql', '/wp-json', '/wp-admin', '/wp-login.php',
        '/favicon.ico', '/sitemap', '/sitemap_index.xml', '/sitemap_index',
        '/robots.txt', '/index.php?rest_route=', '/feed', '/?feed='
    ];
    foreach ($allow_prefixes as $p) {
        if (strpos($uri, $p) === 0) {
            return;
        }
    }

    $target = rtrim(HEADLESS_FRONTEND_ORIGIN, '/') . $uri;
    wp_safe_redirect($target, 301);
    exit;
}, 0);

add_action('admin_menu', function () {
    remove_menu_page('edit-comments.php');
    remove_submenu_page('themes.php', 'theme-editor.php');
    remove_menu_page('themes.php');

    if (!current_user_can('manage_options')) {
        remove_menu_page('tools.php');
        remove_menu_page('plugins.php');
        remove_menu_page('options-general.php');
    }
}, 999);

add_action('wp_dashboard_setup', function () {
    remove_meta_box('dashboard_quick_press', 'dashboard', 'side');
    remove_meta_box('dashboard_primary', 'dashboard', 'side');
    remove_meta_box('dashboard_site_health', 'dashboard', 'normal');
    remove_meta_box('dashboard_activity', 'dashboard', 'normal');
    remove_meta_box('e-dashboard-overview', 'dashboard', 'normal');
});
remove_action('welcome_panel', 'wp_welcome_panel');

add_action('admin_init', function () {
    foreach (['post', 'page'] as $pt) {
        if (post_type_supports($pt, 'comments')) {
            remove_post_type_support($pt, 'comments');
            remove_post_type_support($pt, 'trackbacks');
        }
    }
    remove_menu_page('edit-comments.php');
}, 20);
add_filter('comments_open', '__return_false', 20, 2);
add_filter('pings_open', '__return_false', 20, 2);
add_filter('comments_array', '__return_empty_array', 10, 2);

add_action('init', function () {
    remove_action('admin_print_styles', 'print_emoji_styles');
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('admin_print_scripts', 'print_emoji_detection_script');
    remove_action('wp_print_styles', 'print_emoji_styles');
    remove_filter('wp_mail', 'wp_staticize_emoji_for_email');
    remove_filter('the_content_feed', 'wp_staticize_emoji');
    remove_filter('comment_text_rss', 'wp_staticize_emoji');
    add_filter('emoji_svg_url', '__return_false');

    remove_action('wp_head', 'wp_oembed_add_discovery_links');
    remove_action('wp_head', 'rest_output_link_wp_head');
    remove_action('template_redirect', 'rest_output_link_header', 11);
    remove_action('wp_head', 'rsd_link');
    remove_action('wp_head', 'wlwmanifest_link');
    remove_action('wp_head', 'wp_shortlink_wp_head');
});

add_filter('intermediate_image_sizes_advanced', function ($sizes) {
    $keep = ['thumbnail', 'medium'];
    return array_intersect_key($sizes, array_flip($keep));
});
add_filter('big_image_size_threshold', '__return_false');

add_filter('heartbeat_settings', function ($settings) {
    $settings['interval'] = 60;
    return $settings;
});

// Keep the login language dropdown hidden (single-language installs)
add_filter('login_display_language_dropdown', '__return_false');

// Extend auth cookie lifetime to 30 days for all logins
add_filter('auth_cookie_expiration', function ($seconds) {
    return 30 * DAY_IN_SECONDS;
});

// Reduce stored post revisions to limit database bloat
add_filter('wp_revisions_to_keep', function ($revisions, $post) {
    // Allow CPTs to opt out via filter if needed
    return apply_filters('sonshine_revisions_to_keep', 3, $post);
}, 10, 2);

add_action('admin_bar_menu', function ($bar) {
    $bar->remove_node('wp-logo');
}, 999);

add_filter('map_meta_cap', function ($caps, $cap, $user_id) {
    if ('view_query_monitor' === $cap) {
        $user = get_userdata($user_id);
        if ($user && in_array('administrator', (array) $user->roles, true)) {
            return ['exist'];
        }
        return ['do_not_allow'];
    }
    return $caps;
}, 10, 3);
