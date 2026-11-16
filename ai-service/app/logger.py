import os
import sys
import time
import traceback
from datetime import datetime
from typing import Any, Dict, Optional

# Enable UTF-8 encoding on standard output/error if supported
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# Enable ANSI escape codes in Windows terminal
if os.name == "nt":
    os.system("")

class TerminalColors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    
    # Foreground Colors
    BLACK = "\033[30m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    
    # Bright Colors
    BRIGHT_RED = "\033[91m"
    BRIGHT_GREEN = "\033[92m"
    BRIGHT_YELLOW = "\033[93m"
    BRIGHT_BLUE = "\033[94m"
    BRIGHT_MAGENTA = "\033[95m"
    BRIGHT_CYAN = "\033[96m"
    BRIGHT_WHITE = "\033[97m"

class AILogger:
    @staticmethod
    def _now() -> str:
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    @classmethod
    def activity_start(cls, endpoint: str, details: Optional[Dict[str, Any]] = None):
        """Log when an activity or request starts processing [RUNNING]"""
        c = TerminalColors
        now = cls._now()
        print(f"\n{c.DIM}[{now}]{c.RESET} {c.BOLD}{c.BRIGHT_CYAN}[RUNNING]{c.RESET} {c.BOLD}>> {endpoint}{c.RESET}")
        if details:
            for k, v in details.items():
                if v is not None and v != "":
                    print(f"  {c.CYAN}* {c.RESET}{c.DIM}{k:<16}:{c.RESET} {c.BRIGHT_WHITE}{v}{c.RESET}")
        sys.stdout.flush()

    @classmethod
    def step(cls, module_name: str, message: str, details: Optional[Dict[str, Any]] = None):
        """Log granular execution progress steps inside a service"""
        c = TerminalColors
        now = cls._now()
        print(f"{c.DIM}[{now}]{c.RESET} {c.BOLD}{c.BRIGHT_BLUE}[{module_name.upper()}]{c.RESET} {message}")
        if details:
            for k, v in details.items():
                if v is not None and v != "":
                    print(f"    {c.BLUE}->{c.RESET} {c.DIM}{k}:{c.RESET} {v}")
        sys.stdout.flush()

    @classmethod
    def gemini_call(cls, model_name: str, attempt: int, max_retries: int, prompt_chars: int):
        """Log Gemini AI model dispatch"""
        c = TerminalColors
        now = cls._now()
        print(f"{c.DIM}[{now}]{c.RESET} {c.BOLD}{c.BRIGHT_MAGENTA}[GEMINI-AI]{c.RESET} Dispatching prompt to model {c.MAGENTA}{model_name}{c.RESET} (Attempt {attempt}/{max_retries + 1}) | Size: {prompt_chars:,} characters")
        sys.stdout.flush()

    @classmethod
    def gemini_retry(cls, reason: str, sleep_seconds: int, next_attempt: int):
        """Log rate limit backoff or JSON repair retry"""
        c = TerminalColors
        now = cls._now()
        print(f"{c.DIM}[{now}]{c.RESET} {c.BOLD}{c.BRIGHT_YELLOW}[GEMINI-RETRY]{c.RESET} {reason}")
        print(f"    {c.YELLOW}->{c.RESET} Waiting {sleep_seconds}s before attempt #{next_attempt}...")
        sys.stdout.flush()

    @classmethod
    def activity_success(cls, endpoint: str, duration_sec: Optional[float] = None, details: Optional[Dict[str, Any]] = None):
        """Log when an activity completes successfully [SUCCESS]"""
        c = TerminalColors
        now = cls._now()
        dur_str = f" in {duration_sec:.2f}s" if duration_sec is not None else ""
        print(f"{c.DIM}[{now}]{c.RESET} {c.BOLD}{c.BRIGHT_GREEN}[SUCCESS]{c.RESET} {c.BOLD}>> {endpoint} Completed Successfully{dur_str}{c.RESET}")
        if details:
            for k, v in details.items():
                if v is not None and v != "":
                    print(f"  {c.GREEN}+ {c.RESET}{c.DIM}{k:<16}:{c.RESET} {c.BRIGHT_WHITE}{v}{c.RESET}")
        print()
        sys.stdout.flush()

    @classmethod
    def activity_failed(cls, endpoint: str, error: Any, details: Optional[Dict[str, Any]] = None, with_traceback: bool = True):
        """Log when an activity encounters an error or failure [FAILED]"""
        c = TerminalColors
        now = cls._now()
        err_type = type(error).__name__ if isinstance(error, Exception) else "Error"
        err_msg = str(error)
        
        print(f"\n{c.DIM}[{now}]{c.RESET} {c.BOLD}{c.BRIGHT_RED}[FAILED]{c.RESET} {c.BOLD}{c.BRIGHT_RED}>> {endpoint} Operation Failed!{c.RESET}")
        print(f"  {c.BRIGHT_RED}! Error Type    :{c.RESET} {c.BOLD}{err_type}{c.RESET}")
        print(f"  {c.BRIGHT_RED}! Error Detail  :{c.RESET} {err_msg}")
        
        if details:
            for k, v in details.items():
                if v is not None and v != "":
                    print(f"  {c.RED}* {c.RESET}{c.DIM}{k:<16}:{c.RESET} {v}")
                    
        if with_traceback and isinstance(error, Exception):
            tb = traceback.format_exc()
            if tb and "NoneType: None" not in tb:
                print(f"  {c.RED}* Stack Trace   :{c.RESET}")
                for line in tb.strip().split("\n")[-6:]:
                    print(f"    {c.DIM}{line}{c.RESET}")
        print()
        sys.stdout.flush()

    @classmethod
    def info(cls, message: str):
        c = TerminalColors
        now = cls._now()
        print(f"{c.DIM}[{now}]{c.RESET} {c.BRIGHT_BLUE}[INFO]{c.RESET} {message}")
        sys.stdout.flush()

    @classmethod
    def warn(cls, message: str):
        c = TerminalColors
        now = cls._now()
        print(f"{c.DIM}[{now}]{c.RESET} {c.BRIGHT_YELLOW}[WARN]{c.RESET} {message}")
        sys.stdout.flush()

logger = AILogger
