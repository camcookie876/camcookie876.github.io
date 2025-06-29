from whoosh import index
from whoosh.fields import Schema, TEXT, ID
import json, os, shutil

schema = Schema(
    url=ID(stored=True, unique=True),
    title=TEXT(stored=True),
    text=TEXT
)

if os.path.exists("indexdir"):
    shutil.rmtree("indexdir")
os.mkdir("indexdir")
ix = index.create_in("indexdir", schema)

writer = ix.writer()
with open("crawler/pages.jl", "r") as f:
    for line in f:
        doc = json.loads(line)
        writer.add_document(
            url=doc["url"],
            title=doc["title"],
            text=doc["text"]
        )
writer.commit()
