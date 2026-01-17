# Backend - E-Commerce Dashboard API with CDP Features

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.seed_data import seed_database
from fastapi.staticfiles import StaticFiles
from app.routers import dashboard, customers, orders, inventory, segments, flows, auth, users, admin
from app.core.logger import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Logging
    logger = setup_logging()
    logger.info("Application starting up... Logging initialized.")

    # Create tables and seed data on startup
    # Base.metadata.create_all(bind=engine) # Alembic handles this now
    seed_database() # Seeding should probably be done manually or via migration script in real apps, but kept for logic
    yield


app = FastAPI(
    title="HyperVerge CDP & E-Commerce Dashboard API",
    description="Customer Data Platform API for e-commerce email marketing",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory"])
app.include_router(segments.router, prefix="/api/segments", tags=["Segments"])
app.include_router(flows.router, prefix="/api/flows", tags=["Flows"])


@app.get("/")
async def root():
    return {
        "message": "HyperVerge CDP & E-Commerce Dashboard API",
        "version": "2.0.0",
        "docs": "/docs"
    }
