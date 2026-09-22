const fs = require('fs');
let code = fs.readFileSync('tests/global-setup.ts', 'utf8');

const newActivity = `,
    {
      id: "ACT_TEST_SHORT_ANSWER",
      presentationId: "test-pres-1",
      slideId: 4,
      type: "SHORT_ANSWER",
      mode: "INDIVIDUAL"
    }
  ],`;

code = code.replace("    }\n  ],", "    }" + newActivity);

fs.writeFileSync('tests/global-setup.ts', code, 'utf8');
