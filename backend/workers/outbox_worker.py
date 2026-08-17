import asyncio
import logging
import signal
import sys
import os

# Add parent directory to sys.path for standalone script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from kafka.manager import kafka_manager
from services.outbox_relay import outbox_relay

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("foundry.workers.outbox_relay")


async def main():
    logger.info("🚀 Starting Foundry Kafka Transactional Outbox Relay Worker...")

    # Start Kafka Producer
    await kafka_manager.start()

    # Setup termination signal handlers
    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()

    def signal_handler():
        logger.info("🛑 Termination signal received. Stopping outbox relay worker...")
        stop_event.set()
        asyncio.create_task(outbox_relay.stop())

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, signal_handler)
        except NotImplementedError:
            # Signal handlers not implemented on Windows event loops
            pass

    try:
        await outbox_relay.run_relay_loop()
    except asyncio.CancelledError:
        logger.info("Outbox relay task cancelled.")
    finally:
        await outbox_relay.stop()
        await kafka_manager.stop()
        logger.info("✅ Outbox relay worker shutdown complete.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("🛑 Outbox relay worker stopped manually.")
