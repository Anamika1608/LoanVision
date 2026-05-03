import json
import os

import redis.asyncio as redis

_client: redis.Redis | None = None


async def connect():
    global _client
    _client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        decode_responses=True,
    )
    await _client.ping()


async def close():
    global _client
    if _client:
        await _client.close()
        _client = None


async def publish(channel: str, data: dict):
    if _client:
        await _client.publish(channel, json.dumps(data))
