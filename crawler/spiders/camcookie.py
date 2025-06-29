import scrapy

class CamcookieSpider(scrapy.Spider):
    name = "camcookie"
    start_urls = [
        "https://camcookie876.github.io/index.html",
        "https://camcookie876.github.io/about.html",
        "https://camcookie876.github.io/docs.html"
    ]

    def parse(self, response):
        yield {
            "url": response.url,
            "title": response.css("title::text").get(default="").strip(),
            "text": " ".join(response.css("p::text").getall())[:2000]
        }

        for href in response.css("a::attr(href)").getall():
            yield response.follow(href, self.parse)
