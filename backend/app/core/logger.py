import logging
import sys
from logging.handlers import TimedRotatingFileHandler
import os
from pathlib import Path
from colorlog import ColoredFormatter

# Constants
LOG_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOG_FILE_PATH = LOG_DIR / "backend_api.log"

def setup_logging():
    """
    Configures the root logger with:
    1. Console Handler (Colorized, INFO+)
    2. File Handler (Daily Rotation, DEBUG+, JSON-like structure)
    """
    
    # Ensure log directory exists
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    
    # ------------------------------------------------------------------
    # 1. Formatters
    # ------------------------------------------------------------------
    
    # Detailed Format for Files: Time | Level | Path:Line | Function | Message
    file_format_str = "%(asctime)s | %(levelname)-8s | %(pathname)s:%(lineno)d | %(funcName)s | %(message)s"
    file_formatter = logging.Formatter(file_format_str, datefmt="%Y-%m-%d %H:%M:%S")

    # Concise Color Format for Console: Time | Level | Filename:Line | Message
    console_format_str = "%(log_color)s%(asctime)s | %(levelname)-8s | %(filename)s:%(lineno)d | %(message)s"
    console_formatter = ColoredFormatter(
        console_format_str,
        datefmt="%H:%M:%S",
        reset=True,
        log_colors={
            'DEBUG':    'cyan',
            'INFO':     'green',
            'WARNING':  'yellow',
            'ERROR':    'red',
            'CRITICAL': 'red,bg_white',
        }
    )

    # ------------------------------------------------------------------
    # 2. Handlers
    # ------------------------------------------------------------------

    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)

    # File Handler - Daily Rotation
    # Strategy: 
    # - Active log is always 'backend_api.log'
    # - At midnight, it is renamed to 'backend_api.log.YYYY-MM-DD'
    # - Keeps 30 days of history
    file_handler = TimedRotatingFileHandler(
        filename=LOG_FILE_PATH,
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8"
    )
    file_handler.suffix = "%Y-%m-%d" # Explicit suffix for rotated files
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(file_formatter)

    # ------------------------------------------------------------------
    # 3. Root Logger Setup
    # ------------------------------------------------------------------
    
    # Get the root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)  # Capture everything at root level

    # Remove default handlers to avoid duplication
    if root_logger.handlers:
        root_logger.handlers = []

    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    # ------------------------------------------------------------------
    # 4. Library specific adjustments
    # ------------------------------------------------------------------
    # Prevent double logging if uvicorn is running
    logging.getLogger("uvicorn.error").handlers = []
    logging.getLogger("uvicorn.access").handlers = []
    
    # Propagate uvicorn logs to our root logger so they get formatted nicely
    logging.getLogger("uvicorn").propagate = True
    logging.getLogger("uvicorn.error").propagate = True
    logging.getLogger("uvicorn.access").propagate = True

    logging.info(f"Logging initialized. Logs saved to: {LOG_FILE_PATH}")
    
    return root_logger
