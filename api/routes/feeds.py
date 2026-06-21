from datetime import datetime
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Post

router = APIRouter(
    tags=["Feeds & Sitemap"]
)

@router.get("/sitemap.xml")
def get_sitemap(request: Request, db: Session = Depends(get_db)):
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    urls = [
        {"loc": f"{base_url}/", "changefreq": "weekly", "priority": "1.0"},
        {"loc": f"{base_url}/blog", "changefreq": "daily", "priority": "0.8"},
        {"loc": f"{base_url}/admin", "changefreq": "monthly", "priority": "0.3"},
    ]
    posts = db.query(Post).filter(Post.status == "published").all()
    for post in posts:
        lastmod = post.updated_at.strftime("%Y-%m-%d") if post.updated_at else datetime.utcnow().strftime("%Y-%m-%d")
        urls.append({
            "loc": f"{base_url}/blog/{post.slug}",
            "lastmod": lastmod,
            "changefreq": "monthly",
            "priority": "0.6"
        })
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        xml_content += '  <url>\n'
        xml_content += f'    <loc>{u["loc"]}</loc>\n'
        if "lastmod" in u:
            xml_content += f'    <lastmod>{u["lastmod"]}</lastmod>\n'
        xml_content += f'    <changefreq>{u["changefreq"]}</changefreq>\n'
        xml_content += f'    <priority>{u["priority"]}</priority>\n'
        xml_content += '  </url>\n'
    xml_content += '</urlset>\n'
    return Response(content=xml_content, media_type="application/xml")

@router.get("/feed.xml")
def get_rss_feed(request: Request, db: Session = Depends(get_db)):
    base_url = f"{request.url.scheme}://{request.url.netloc}"
    posts = db.query(Post).filter(Post.status == "published").order_by(Post.published_at.desc()).all()
    xml_content = '<?xml version="1.0" encoding="UTF-8" ?>\n'
    xml_content += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n'
    xml_content += '<channel>\n'
    xml_content += '  <title>Nishad Anil Portfolio Blog</title>\n'
    xml_content += f'  <link>{base_url}/blog</link>\n'
    xml_content += '  <description>Latest thoughts and articles by Nishad Anil</description>\n'
    xml_content += '  <language>en-us</language>\n'
    xml_content += f'  <lastBuildDate>{datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")}</lastBuildDate>\n'
    xml_content += f'  <atom:link href="{base_url}/feed.xml" rel="self" type="application/rss+xml" />\n'
    for post in posts:
        pub_date = post.published_at.strftime("%a, %d %b %Y %H:%M:%S GMT") if post.published_at else post.created_at.strftime("%a, %d %b %Y %H:%M:%S GMT")
        link = f"{base_url}/blog/{post.slug}"
        excerpt = post.excerpt or ""
        xml_content += '  <item>\n'
        xml_content += f'    <title><![CDATA[{post.title}]]></title>\n'
        xml_content += f'    <link>{link}</link>\n'
        xml_content += f'    <guid>{link}</guid>\n'
        xml_content += f'    <pubDate>{pub_date}</pubDate>\n'
        xml_content += f'    <description><![CDATA[{excerpt}]]></description>\n'
        xml_content += '  </item>\n'
    xml_content += '</channel>\n'
    xml_content += '</rss>\n'
    return Response(content=xml_content, media_type="application/xml")
