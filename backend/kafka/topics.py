from enum import Enum


class KafkaTopics(str, Enum):
    # Startup Lifecycle Topics
    STARTUP_CREATED = "startup.created"
    STARTUP_UPDATED = "startup.updated"
    STARTUP_APPROVED = "startup.approved"
    STARTUP_REJECTED = "startup.rejected"
    STARTUP_DELETED = "startup.deleted"
    STARTUP_SAVED = "startup.saved"
    STARTUP_UNSAVED = "startup.unsaved"

    # AI & Web Scraping Pipeline Topics
    STARTUP_SCRAPE_REQUESTED = "startup.scrape_requested"
    STARTUP_SCRAPED = "startup.scraped"
    STARTUP_SCORE_REQUESTED = "startup.score_requested"
    STARTUP_SCORED = "startup.scored"
    STARTUP_DOCUMENT_UPLOADED = "startup.document_uploaded"

    # User & Investor Lifecycle Topics
    USER_REGISTERED = "user.registered"
    INVESTOR_REGISTERED = "investor.registered"
    INVESTOR_UPDATED = "investor.updated"
    INVESTOR_DELETED = "investor.deleted"
    INVESTOR_MATCHED = "investor.matched"

    # Notifications Topics
    NOTIFICATION_EMAIL = "notification.email"
    NOTIFICATION_PUSH = "notification.push"

    # Feed & Messaging Topics
    FEED_POST_CREATED = "feed.post_created"
    FEED_REPLY_CREATED = "feed.reply_created"
    MESSAGE_SENT = "message.sent"

    # Audit, Indexing & Caching
    AUDIT_LOGS = "audit.logs"
    CACHE_INVALIDATE = "cache.invalidate"
    SEARCH_INDEX = "search.index"

    # Dead Letter Queues (DLQ)
    STARTUP_FAILED = "startup.failed"
    SCRAPING_FAILED = "scraping.failed"
    DOCUMENT_FAILED = "document.failed"
    NOTIFICATION_FAILED = "notification.failed"
    MATCHING_FAILED = "matching.failed"
    AUDIT_FAILED = "audit.failed"


# Mapping from primary topic to its DLQ counterpart
DLQ_TOPIC_MAP = {
    KafkaTopics.STARTUP_CREATED: KafkaTopics.STARTUP_FAILED,
    KafkaTopics.STARTUP_UPDATED: KafkaTopics.STARTUP_FAILED,
    KafkaTopics.STARTUP_APPROVED: KafkaTopics.STARTUP_FAILED,
    KafkaTopics.STARTUP_DOCUMENT_UPLOADED: KafkaTopics.DOCUMENT_FAILED,
    KafkaTopics.STARTUP_SCRAPE_REQUESTED: KafkaTopics.SCRAPING_FAILED,
    KafkaTopics.STARTUP_SCORE_REQUESTED: KafkaTopics.STARTUP_FAILED,
    KafkaTopics.NOTIFICATION_EMAIL: KafkaTopics.NOTIFICATION_FAILED,
    KafkaTopics.NOTIFICATION_PUSH: KafkaTopics.NOTIFICATION_FAILED,
    KafkaTopics.INVESTOR_MATCHED: KafkaTopics.MATCHING_FAILED,
    KafkaTopics.AUDIT_LOGS: KafkaTopics.AUDIT_FAILED,
}
