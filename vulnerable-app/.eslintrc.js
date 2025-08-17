module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
    },
    extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
    plugins: ['security', 'no-secrets'],
    rules: {
        // VIOLATION 1: No input validation
        'security/detect-object-injection': 'error',
        'security/detect-non-literal-require': 'error',
        'security/detect-possible-timing-attacks': 'error',

        // VIOLATION 2: SQL Injection - Template literal injection
        'security/detect-non-literal-fs-filename': 'error',
        'security/detect-eval-with-expression': 'error',
        'security/detect-pseudoRandomBytes': 'error',

        // Custom rule for SQL injection patterns
        'no-template-curly-in-string': 'error',

        // VIOLATION 3: Logging sensitive data
        'security/detect-buffer-noassert': 'error',
        'security/detect-child-process': 'error',
        'security/detect-disable-mustache-escape': 'error',

        // VIOLATION 4 & 8: Hardcoded credentials/secrets
        'no-secrets/no-secrets': [
            'error',
            {
                tolerance: 4.2,
                additionalRegexes: {
                    'Hardcoded Password': 'password\\s*[:=]\\s*["\'][^"\']{3,}["\']',
                    'API Key': '(api[_-]?key|apikey)\\s*[:=]\\s*["\'][^"\']{10,}["\']',
                    'Database Password': '(db[_-]?password|database[_-]?password)\\s*[:=]\\s*["\'][^"\']{3,}["\']',
                    'Generic Secret': '(secret|token|key)\\s*[:=]\\s*["\'][^"\']{8,}["\']',
                },
            },
        ],

        // VIOLATION 5: Un validated queries
        'security/detect-unsafe-regex': 'error',

        // VIOLATION 6: Information exposure
        'security/detect-new-buffer': 'error',

        // VIOLATION 7: Error exposure
        'security/detect-bidi-characters': 'error',

        // VIOLATION 9: Weak crypto
        'security/detect-insecure-randomness': 'error',

        // Additional security rules
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error',
        'no-console': 'warn',
        '@typescript-eslint/no-explicit-any': 'error',
    },

    overrides: [
        {
            files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
            rules: {
                'no-restricted-syntax': [
                    'error',
                    {
                        selector:
                            'TemplateLiteral[expressions.length>0] CallExpression[callee.property.name="execute"]',
                        message:
                            'Potential SQL injection: Template literals with expressions in SQL queries are dangerous',
                    },
                    {
                        selector: 'BinaryExpression[operator="+"] CallExpression[callee.property.name=/execute|query/]',
                        message: 'Potential SQL injection: String concatenation in SQL queries is dangerous',
                    },
                    {
                        selector:
                            'CallExpression[callee.object.name="console"][callee.property.name="log"] MemberExpression[object.object.name="process"][object.property.name="env"]',
                        message: 'Logging environment variables may expose sensitive information',
                    },
                    {
                        selector: 'Property[key.name="password"][value.type="Literal"]',
                        message: 'Hardcoded password detected in object literal',
                    },
                    {
                        selector:
                            'CallExpression[callee.object.name="crypto"][callee.property.name="createHash"] Literal[value="md5"]',
                        message: 'MD5 is cryptographically broken and should not be used',
                    },
                    {
                        selector:
                            'CallExpression[callee.object.name="crypto"][callee.property.name="createHash"] Literal[value="sha1"]',
                        message: 'SHA1 is cryptographically weak and should not be used',
                    },
                    {
                        selector: 'Property[key.name="Access-Control-Allow-Origin"][value.value="*"]',
                        message: 'Overly permissive CORS policy detected',
                    },
                    {
                        selector: 'Property[key.name="stack"]',
                        message: 'Exposing stack traces can leak sensitive information',
                    },
                    {
                        selector: 'Property[key.name=/env|systemInfo|nodeVersion|platform/]',
                        message: 'Exposing system information can aid attackers',
                    },
                ],

                'no-restricted-properties': [
                    'error',
                    {
                        object: 'process',
                        property: 'env',
                        message: 'Direct access to process.env should be validated and sanitized',
                    },
                ],
            },
        },
    ],
};
