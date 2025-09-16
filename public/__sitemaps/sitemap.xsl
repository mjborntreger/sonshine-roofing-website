<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
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
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="/sm:urlset/sm:url | /urlset/url">
                    <tr>
                      <td><a href="{sm:loc|loc}"><xsl:value-of select="sm:loc|loc"/></a></td>
                      <td><xsl:value-of select="sm:lastmod|lastmod"/></td>
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
