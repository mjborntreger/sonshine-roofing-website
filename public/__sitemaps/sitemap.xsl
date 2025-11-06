<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <xsl:output method="html" version="1.0" encoding="UTF-8" doctype-public="-//W3C//DTD XHTML 1.0 Strict//EN"/>
  <xsl:strip-space elements="*"/>

  <xsl:template match="/">
    <html>
      <head>
        <meta charset="utf-8" />
        <title>
          <xsl:choose>
            <xsl:when test="/sm:sitemapindex | /sitemapindex">Sitemap Index</xsl:when>
            <xsl:otherwise>Sitemap</xsl:otherwise>
          </xsl:choose>
        </title>
        <style type="text/css">
          body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.45;color:#0f172a;background:#0b1220;margin:0;padding:2rem}
          .wrap{max-width:1100px;margin:0 auto;background:#0f172a;border:1px solid #1f2937;border-radius:12px;overflow:hidden}
          header{padding:16px 20px;background:#111827;border-bottom:1px solid #1f2937;color:#e5e7eb}
          h1{font-size:18px;margin:0}
          table{width:100%;border-collapse:collapse}
          th,td{padding:10px 12px;border-bottom:1px solid #1f2937}
          th{background:#0b1220;text-align:left;color:#9ca3af;font-size:12px;letter-spacing:.04em;text-transform:uppercase}
          td{color:#d1d5db;font-size:14px}
          a{color:#93c5fd;text-decoration:none}
          a:hover{text-decoration:underline}
          .muted{color:#9ca3af;font-size:12px}
          .video-item{margin:6px 0;padding:8px 10px;border:1px solid #1f2937;border-radius:8px;background:#0b1220}
          .video-title{font-weight:600;font-size:13px;color:#f8fafc;margin-bottom:4px}
          .video-meta{color:#9ca3af;font-size:12px;margin-top:2px}
          .video-meta a{color:#93c5fd}
          .video-meta .tag{display:inline-block;margin:2px 4px 0 0;padding:2px 6px;border-radius:999px;background:#172033;color:#cbd5f5;font-size:11px}
          .image-item{margin:6px 0;padding:8px 10px;border:1px solid #1f2937;border-radius:8px;background:#0b1220}
          .image-title{font-weight:600;font-size:13px;color:#f8fafc;margin-bottom:4px}
          .image-meta{color:#9ca3af;font-size:12px;margin-top:2px}
          .image-meta a{color:#93c5fd}
          .back-link{display:inline-flex;align-items:center;gap:6px;margin-top:12px;padding:6px 12px;border:1px solid #1f2937;border-radius:8px;background:#172033;color:#cbd5f5;font-size:13px;text-decoration:none}
          .back-link:hover{background:#1f2a44;text-decoration:none}
        </style>
      </head>
      <body>
        <div class="wrap">
          <header>
            <h1>
              <xsl:choose>
                <xsl:when test="/sm:sitemapindex | /sitemapindex">Sitemap Index</xsl:when>
                <xsl:otherwise>URL Sitemap</xsl:otherwise>
              </xsl:choose>
            </h1>
            <div class="muted">
              Generated for human-friendly viewing. Search engines ignore this styling.
            </div>
            <xsl:if test="not(/sm:sitemapindex | /sitemapindex)">
              <a class="back-link" href="/sitemap_index">Back to sitemap index</a>
            </xsl:if>
          </header>
          <xsl:choose>
            <xsl:when test="/sm:sitemapindex | /sitemapindex">
              <table>
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="/sm:sitemapindex/sm:sitemap | /sitemapindex/sitemap">
                    <tr>
                      <td><a href="{sm:loc|loc}"><xsl:value-of select="sm:loc|loc"/></a></td>
                      <td><xsl:value-of select="sm:lastmod|lastmod"/></td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:when>
            <xsl:otherwise>
              <table>
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Last Modified</th>
                    <th>Images</th>
                    <th>Videos</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="/sm:urlset/sm:url | /urlset/url">
                    <tr>
                      <td><a href="{sm:loc|loc}"><xsl:value-of select="sm:loc|loc"/></a></td>
                      <td><xsl:value-of select="sm:lastmod|lastmod"/></td>
                      <td>
                        <xsl:choose>
                          <xsl:when test="image:image">
                            <xsl:for-each select="image:image">
                              <div class="image-item">
                                <div class="image-title">
                                  <xsl:choose>
                                    <xsl:when test="normalize-space(image:title)">
                                      <xsl:value-of select="image:title"/>
                                    </xsl:when>
                                    <xsl:otherwise>Image</xsl:otherwise>
                                  </xsl:choose>
                                </div>
                                <div class="image-meta">
                                  Source:
                                  <a href="{image:loc}">
                                    <xsl:value-of select="image:loc"/>
                                  </a>
                                </div>
                              </div>
                            </xsl:for-each>
                          </xsl:when>
                          <xsl:otherwise>
                            <span class="muted">—</span>
                          </xsl:otherwise>
                        </xsl:choose>
                      </td>
                      <td>
                        <xsl:choose>
                          <xsl:when test="video:video">
                            <xsl:for-each select="video:video">
                              <div class="video-item">
                                <div class="video-title">
                                  <xsl:value-of select="video:title"/>
                                </div>
                                <div class="video-meta">
                                  Thumbnail:
                                  <a href="{video:thumbnail_loc}">
                                    <xsl:value-of select="video:thumbnail_loc"/>
                                  </a>
                                </div>
                                <xsl:if test="video:publication_date">
                                  <div class="video-meta">
                                    Published: <xsl:value-of select="video:publication_date"/>
                                  </div>
                                </xsl:if>
                                <div class="video-meta">
                                  Player:
                                  <a href="{video:player_loc}">
                                    <xsl:value-of select="video:player_loc"/>
                                  </a>
                                </div>
                                <xsl:if test="video:content_loc">
                                  <div class="video-meta">
                                    Content:
                                    <a href="{video:content_loc}">
                                      <xsl:value-of select="video:content_loc"/>
                                    </a>
                                  </div>
                                </xsl:if>
                                <xsl:if test="video:description">
                                  <div class="video-meta">
                                    <xsl:value-of select="video:description"/>
                                  </div>
                                </xsl:if>
                                <xsl:if test="video:tag">
                                  <div class="video-meta">
                                    <xsl:for-each select="video:tag">
                                      <span class="tag"><xsl:value-of select="."/></span>
                                    </xsl:for-each>
                                  </div>
                                </xsl:if>
                              </div>
                            </xsl:for-each>
                          </xsl:when>
                          <xsl:otherwise>
                            <span class="muted">—</span>
                          </xsl:otherwise>
                        </xsl:choose>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:otherwise>
          </xsl:choose>
        </div>
      </body>
    </html>
  </xsl:template>
  
</xsl:stylesheet>
