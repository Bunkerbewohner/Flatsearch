import cgi, cgitb
import os, re
import urllib.parse
import urllib.request

cgitb.enable()

print("Content-Type: text/html; charset=UTF-8\n\n")

url = os.environ.get('QUERY_STRING').replace("url=", "")
url = urllib.parse.unquote(url)
url = re.sub(r"http:/([^/])", "http://\\1", url)

content = urllib.request.urlopen(url).read()

if "immobilienscout24.de" in url:
    encoding = "ISO-8859-1"
else:
    encoding = "UTF-8"

content = content.decode(encoding)
print(content)