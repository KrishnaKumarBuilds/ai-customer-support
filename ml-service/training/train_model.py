import os
import re
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

def clean_text(text: str) -> str:
    """Preprocess and normalize text for NLP classification."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def train_and_export():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, "dataset", "tickets.csv")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    print(f"[*] Loading dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)
    print(f"[+] Loaded {len(df)} samples across {df['category'].nunique()} categories.")

    # Combine subject and description with emphasis on subject
    df['clean_subject'] = df['subject'].fillna('').apply(clean_text)
    df['clean_description'] = df['description'].fillna('').apply(clean_text)
    df['combined_text'] = df['clean_subject'] + " " + df['clean_subject'] + " " + df['clean_description']

    # Vectorization
    print("[*] Fitting TF-IDF Vectorizer...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True,
        stop_words='english'
    )
    X = vectorizer.fit_transform(df['combined_text'])

    # 1. Train Category Classifier
    print("[*] Training Category Model...")
    y_category = df['category']
    category_model = LogisticRegression(C=2.5, max_iter=1000, class_weight='balanced', random_state=42)
    category_model.fit(X, y_category)
    cat_preds = category_model.predict(X)
    cat_acc = accuracy_score(y_category, cat_preds)
    print(f"[+] Category Model Accuracy: {cat_acc * 100:.2f}%")

    # 2. Train Priority Classifier
    print("[*] Training Priority Model...")
    y_priority = df['priority']
    priority_model = LogisticRegression(C=2.0, max_iter=1000, class_weight='balanced', random_state=42)
    priority_model.fit(X, y_priority)
    prio_preds = priority_model.predict(X)
    prio_acc = accuracy_score(y_priority, prio_preds)
    print(f"[+] Priority Model Accuracy: {prio_acc * 100:.2f}%")

    # 3. Train Sentiment Classifier
    print("[*] Training Sentiment Model...")
    y_sentiment = df['sentiment']
    sentiment_model = LogisticRegression(C=2.0, max_iter=1000, class_weight='balanced', random_state=42)
    sentiment_model.fit(X, y_sentiment)
    sent_preds = sentiment_model.predict(X)
    sent_acc = accuracy_score(y_sentiment, sent_preds)
    print(f"[+] Sentiment Model Accuracy: {sent_acc * 100:.2f}%")

    # Save artifacts
    print("[*] Saving trained model artifacts to models/ directory...")
    joblib.dump(vectorizer, os.path.join(models_dir, "vectorizer.pkl"))
    joblib.dump(category_model, os.path.join(models_dir, "category_model.pkl"))
    joblib.dump(priority_model, os.path.join(models_dir, "priority_model.pkl"))
    joblib.dump(sentiment_model, os.path.join(models_dir, "sentiment_model.pkl"))

    # Metadata
    metadata = {
        "num_samples": len(df),
        "categories": sorted(df['category'].unique().tolist()),
        "priorities": sorted(df['priority'].unique().tolist()),
        "sentiments": sorted(df['sentiment'].unique().tolist()),
        "category_accuracy": round(float(cat_acc), 4),
        "priority_accuracy": round(float(prio_acc), 4),
        "sentiment_accuracy": round(float(sent_acc), 4),
        "skill_mapping": {
            "Technical Issue": "Technical Support",
            "Security": "Cybersecurity & Identity",
            "Billing": "Billing & Accounts",
            "Payment": "Billing & Accounts",
            "Login": "Identity & Access",
            "Account": "Identity & Access",
            "Product Issue": "Product & Bug Triage",
            "Feature Request": "Customer Success",
            "Complaint": "Customer Success & Escalations",
            "Other": "General Support"
        }
    }
    with open(os.path.join(models_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print("[SUCCESS] Training pipeline completed successfully!")
    return metadata

if __name__ == "__main__":
    train_and_export()
