from typing import Optional
from groq import Groq
from app.config import settings , debug_print

class AIClientManager:
    def __init__(self):
        self.client: Optional[Groq] = None
        

    def initialize(self):
        api_key = settings.GROQ_API_KEY
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is missing!")
        
        self.client = Groq(api_key=api_key)
        debug_print("🚀 Groq AI Client initialized successfully!")

ai_manager = AIClientManager()