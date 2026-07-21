<?php
/**
 * WPGraphQL ↔ Relevanssi bridge (tolerant to differing hook signatures).
 * - Flags GraphQL searches
 * - Routes post connections and facetCounts through Relevanssi
 * - Forces relevance ordering when search is present
 */

add_filter('graphql_connection_query_args', function ($args) {
    if (empty($args['s'])) return $args;
    $args['relevanssi'] = true;
    return $args;
}, 10, 1);

add_filter('graphql_post_object_connection_query', function ($query /*, ...$rest */) {
    if (!($query instanceof WP_Query)) return $query;
    if (!$query->get('relevanssi') || !$query->get('s')) return $query;

    $query->set('relevanssi', true);
    $query->set('orderby', 'relevance');
    $query->set('order', 'DESC');
    relevanssi_do_query($query);
    return $query;
}, 10, 1);

// Cover facetCounts and any other GraphQL search queries.
add_action('pre_get_posts', function (WP_Query $q) {
    if (!defined('GRAPHQL_REQUEST') || is_admin() || !$q->get('s')) return;
    $q->set('relevanssi', true);
    $q->set('orderby', 'relevance');
    $q->set('order', 'DESC');
}, 10, 1);

add_filter('posts_pre_query', function ($posts, WP_Query $q) {
    if (!defined('GRAPHQL_REQUEST') || !$q->get('relevanssi') || !$q->get('s')) return $posts;
    relevanssi_do_query($q);
    return $q->posts;
}, 10, 2);
