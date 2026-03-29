import structlog
logger = structlog.get_logger(__name__)

from motor.motor_asyncio import AsyncIOMotorClient
import os

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()

async def connect_to_mongo():
    """Connect to MongoDB."""
    mongo_url = os.getenv("MONGO_URL", "mongodb://admin:mongo_pass@mongodb:27017")
    mongo_db_name = os.getenv("MONGO_DB", "bookings")
    
    logger.info(f"📦 Connecting to MongoDB: {mongo_url}")
    
    try:
        db.client = AsyncIOMotorClient(mongo_url)
        db.database = db.client[mongo_db_name]
        
        # Verify connection
        await db.client.server_info()
        logger.info("✅ Successfully connected to MongoDB")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection."""
    if db.client:
        db.client.close()
        logger.info("MongoDB connection closed")

def get_database():
    """Get MongoDB database instance."""
    return db.database

async def create_indexes():
    """Create database indexes for better query performance."""
    try:
        bookings_collection = db.database.bookings
        
        # Create indexes
        await bookings_collection.create_index("user_id")
        await bookings_collection.create_index("restaurant_id")
        await bookings_collection.create_index("date")
        await bookings_collection.create_index("status")
        await bookings_collection.create_index([("date", 1), ("time_slot", 1)])
        
        logger.info("✅ Database indexes created")
    except Exception as e:
        logger.error(f"⚠️  Failed to create indexes: {e}")
