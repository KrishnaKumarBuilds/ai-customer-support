import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from predictor import TicketPredictor
from training.train_model import train_and_export

app = FastAPI(
    title="SupportIQ AI/ML Ticket Classification Service",
    version="1.0.0",
    description="FastAPI microservice for predicting ticket category, priority, sentiment, confidence, and agent skills."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = TicketPredictor()

class TicketRequest(BaseModel):
    subject: str = Field(..., example="Database connection timeout on production cluster")
    description: str = Field(..., example="Our PostgreSQL instance is not responding. API endpoints return 500 error.")

class TicketResponse(BaseModel):
    category: str
    priority: str
    sentiment: str
    confidence: float
    suggested_skill: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SupportIQ ML Service",
        "models_loaded": predictor.vectorizer is not None,
        "metadata": predictor.metadata
    }

@app.post("/predict", response_model=TicketResponse)
def predict_ticket(req: TicketRequest):
    if not req.subject.strip() and not req.description.strip():
        raise HTTPException(status_code=400, detail="Subject or description must not be empty.")
    result = predictor.predict(req.subject, req.description)
    return result

@app.post("/train")
def trigger_training():
    try:
        metadata = train_and_export()
        predictor.load_models()
        return {
            "status": "success",
            "message": "Models retrained and reloaded successfully.",
            "metrics": metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/categories")
def get_categories():
    return {
        "categories": [
            "Technical Issue",
            "Security",
            "Billing",
            "Payment",
            "Login",
            "Account",
            "Product Issue",
            "Feature Request",
            "Complaint",
            "Other"
        ],
        "priorities": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
        "sentiments": ["Positive", "Neutral", "Negative"]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
