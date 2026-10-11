"""
FORENSIC-X Backend — Hashing Utility
======================================
Utility for computing cryptographic hashes of evidence files.

WHY: Files can be large (memory dumps, disk images). Streaming
the file in chunks prevents memory exhaustion.

Status: IMPLEMENTED
"""

import hashlib
from pathlib import Path


def compute_file_hash(file_path: str | Path, algorithm: str = "sha256", chunk_size: int = 8192) -> str:
    """Compute the hash of a file efficiently by streaming chunks.
    
    Args:
        file_path: Path to the file.
        algorithm: Hash algorithm (default: sha256). Must be supported by hashlib.
        chunk_size: Bytes to read per chunk.
        
    Returns:
        Hexadecimal hash string.
        
    Raises:
        ValueError: If algorithm is unsupported.
        FileNotFoundError: If file does not exist.
    """
    if algorithm not in hashlib.algorithms_available:
        raise ValueError(f"Unsupported hash algorithm: {algorithm}")
        
    hasher = hashlib.new(algorithm)
    path = Path(file_path)
    
    if not path.is_file():
        raise FileNotFoundError(f"File not found: {file_path}")
        
    with open(path, "rb") as f:
        while chunk := f.read(chunk_size):
            hasher.update(chunk)
            
    return hasher.hexdigest()

def verify_hash(file_path: str | Path, expected_hash: str, algorithm: str = "sha256") -> bool:
    """Verify that a file's hash matches an expected value."""
    actual_hash = compute_file_hash(file_path, algorithm)
    return actual_hash.lower() == expected_hash.lower()
