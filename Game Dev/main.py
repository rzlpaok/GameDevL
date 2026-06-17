import os
import webview
from model import ModelAPI

if __name__ == '__main__':
    # Initialize the API
    api = ModelAPI()
    
    # Path to the index.html file
    web_dir = os.path.join(os.path.dirname(__file__), 'web')
    index_path = os.path.join(web_dir, 'index.html')
    
    # Create pywebview window
    # js_api parameter exposes our Python class to Javascript via pywebview.api
    window = webview.create_window(
        title='Decision Maker',
        url=index_path,
        js_api=api,
        width=1024,
        height=768,
        min_size=(800, 600)
    )
    
    # Start the pywebview local server/loop
    webview.start(debug=True)
