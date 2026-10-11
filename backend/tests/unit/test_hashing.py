import pytest
import os
import tempfile
from pathlib import Path
from app.core.hashing import compute_file_hash, verify_hash


def test_compute_file_hash():
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b"Hello Forensic-X")
        temp_path = f.name
        
    try:
        # Expected SHA-256 for "Hello Forensic-X"
        # Let's dynamically compute it to ensure correctness in test
        import hashlib
        expected = hashlib.sha256(b"Hello Forensic-X").hexdigest()
        
        computed = compute_file_hash(temp_path)
        assert computed == expected
    finally:
        os.unlink(temp_path)


def test_verify_hash():
    with tempfile.NamedTemporaryFile(delete=False) as f:
        f.write(b"Evidence data")
        temp_path = f.name
        
    try:
        import hashlib
        expected = hashlib.sha256(b"Evidence data").hexdigest()
        
        assert verify_hash(temp_path, expected) is True
        assert verify_hash(temp_path, "invalidhash123") is False
    finally:
        os.unlink(temp_path)


def test_compute_file_hash_unsupported_algorithm():
    with pytest.raises(ValueError, match="Unsupported hash algorithm"):
        compute_file_hash("dummy.txt", algorithm="not_a_real_algo")


def test_compute_file_hash_file_not_found():
    with pytest.raises(FileNotFoundError):
        compute_file_hash("nonexistent_file.xyz")
