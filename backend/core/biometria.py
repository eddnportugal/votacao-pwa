"""
Biometria helpers.
The server NEVER stores raw biometric data — only irreversible hashes.
"""
import hashlib


def hash_vetor_facial(vetor: list[float]) -> str:
    """
    Receives the 128-point facial vector from FaceAPI.js (sent as a list of floats),
    computes SHA-256 hash, and returns the hex digest.
    The raw vector is never persisted on the server.
    """
    payload = ",".join(f"{v:.6f}" for v in vetor)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def verificar_hash(vetor: list[float], hash_armazenado: str) -> bool:
    """
    Compares a new facial vector hash against the stored hash.
    Returns True if they match.
    """
    return hash_vetor_facial(vetor) == hash_armazenado
