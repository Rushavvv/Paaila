from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import config.settings as config
import authentication.authentication as auth
import database.database as database
from models.models import UserCreate, UserResponse, Token

app = FastAPI(title="My App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== PUBLIC ENDPOINTS ==========

@app.get("/")
async def root():
    """Serve the main page"""
    static_file = Path("static/index.html")
    if static_file.exists():
        return FileResponse(static_file)
    return {"message": "Welcome to the Paaila"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}

# ========== AUTH ENDPOINTS ==========

@app.post("/api/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint - returns JWT token"""
    # Get user from database
    user = database.get_user(form_data.username)
    
    # Check if user exists and password is correct
    if not user or not auth.verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Create token
    token = auth.create_token(user["username"])
    return {"access_token": token, "token_type": "bearer"}

@app.post("/api/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if username already exists
    if database.user_exists(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Hash the password
    hashed_password = auth.hash_password(user_data.password)
    
    # Create the user
    user = database.create_user(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    
    return UserResponse(
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        disabled=user["disabled"]
    )

# ========== PROTECTED ENDPOINTS ==========

@app.get("/api/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(auth.get_current_user)):
    """Get current user info - requires authentication"""
    return UserResponse(
        username=current_user["username"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        disabled=current_user["disabled"]
    )

@app.get("/api/protected")
async def protected_route(current_user: dict = Depends(auth.get_current_user)):
    """Example protected route"""
    return {
        "message": f"Hello {current_user['username']}!",
        "info": "This is a protected route"
    }

# Serve static files if they exist
static_path = Path("static")
if static_path.exists():
    app.mount("/static", StaticFiles(directory="static"), name="static")