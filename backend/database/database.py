
users_db = {
    "demo": {
        "username": "demo",
        "email": "demo@example.com",
        "full_name": "Demo User",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        "disabled": False,
    }
}

def get_user(username: str):
    """Get a user by username"""
    if username in users_db:
        return users_db[username]
    return None

def create_user(username: str, email: str, hashed_password: str, full_name: str = None):
    """Create a new user"""
    users_db[username] = {
        "username": username,
        "email": email,
        "full_name": full_name,
        "hashed_password": hashed_password,
        "disabled": False,
    }
    return users_db[username]

def user_exists(username: str) -> bool:
    """Check if username exists"""
    return username in users_db