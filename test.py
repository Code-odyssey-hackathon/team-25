import requests
import base64

url = "https://api-inference.huggingface.co/models/google/vit-base-patch16-224"
headers = {"Authorization": "Bearer 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"}
data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')

response = requests.post(url, headers=headers, data=data)
print(response.status_code)
print(response.json())
