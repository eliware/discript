// Keep the test process hermetic: the user's home configuration must never
// change test connection, daemon, authentication, or port settings.
process.env.DISCRIPT_TEST_MODE = '1';
