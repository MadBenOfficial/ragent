export const ritualWalletAbi = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "lockDuration", type: "uint256" }],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "lockUntil",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const asyncJobTrackerAbi = [
  {
    name: "hasPendingJobForSender",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "sender", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "JobAdded",
    type: "event",
    inputs: [
      { name: "executor", type: "address", indexed: true },
      { name: "jobId", type: "bytes32", indexed: true },
      { name: "precompileAddress", type: "address", indexed: true },
      { name: "commitBlock", type: "uint256", indexed: false },
      { name: "precompileInput", type: "bytes", indexed: false },
      { name: "senderAddress", type: "address", indexed: false },
      { name: "previousBlockHash", type: "bytes32", indexed: false },
      { name: "previousBlockNumber", type: "uint256", indexed: false },
      { name: "previousBlockTimestamp", type: "uint256", indexed: false },
      { name: "ttl", type: "uint256", indexed: false },
      { name: "createdAt", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Phase1Settled",
    type: "event",
    inputs: [
      { name: "jobId", type: "bytes32", indexed: true },
      { name: "executor", type: "address", indexed: true },
      { name: "settledBlock", type: "uint256", indexed: false },
    ],
  },
  {
    name: "ResultDelivered",
    type: "event",
    inputs: [
      { name: "jobId", type: "bytes32", indexed: true },
      { name: "target", type: "address", indexed: true },
      { name: "success", type: "bool", indexed: false },
    ],
  },
  {
    name: "JobRemoved",
    type: "event",
    inputs: [
      { name: "executor", type: "address", indexed: true },
      { name: "jobId", type: "bytes32", indexed: true },
      { name: "completed", type: "bool", indexed: true },
    ],
  },
  {
    name: "isLongRunning",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "isPhase1Settled",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
] as const;

export const teeServiceRegistryAbi = [
  {
    name: "getServicesByCapability",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "capability", type: "uint8" },
      { name: "checkValidity", type: "bool" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          {
            name: "node",
            type: "tuple",
            components: [
              { name: "paymentAddress", type: "address" },
              { name: "teeAddress", type: "address" },
              { name: "teeType", type: "uint8" },
              { name: "publicKey", type: "bytes" },
              { name: "endpoint", type: "string" },
              { name: "certPubKeyHash", type: "bytes32" },
              { name: "capability", type: "uint8" },
            ],
          },
          { name: "isValid", type: "bool" },
          { name: "workloadId", type: "bytes32" },
        ],
      },
    ],
  },
] as const;

const sovereignStorageRefTuple = {
  type: "tuple",
  components: [
    { name: "platform", type: "string" },
    { name: "path", type: "string" },
    { name: "keyRef", type: "string" },
  ],
} as const;

const sovereignAgentParamsTuple = {
  name: "params",
  type: "tuple",
  components: [
    { name: "executor", type: "address" },
    { name: "ttl", type: "uint256" },
    { name: "userPublicKey", type: "bytes" },
    { name: "pollIntervalBlocks", type: "uint64" },
    { name: "maxPollBlock", type: "uint64" },
    { name: "taskIdMarker", type: "string" },
    { name: "deliveryTarget", type: "address" },
    { name: "deliverySelector", type: "bytes4" },
    { name: "deliveryGasLimit", type: "uint256" },
    { name: "deliveryMaxFeePerGas", type: "uint256" },
    { name: "deliveryMaxPriorityFeePerGas", type: "uint256" },
    { name: "cliType", type: "uint16" },
    { name: "prompt", type: "string" },
    { name: "encryptedSecrets", type: "bytes" },
    { ...sovereignStorageRefTuple, name: "convoHistory" },
    { ...sovereignStorageRefTuple, name: "output" },
    { name: "skills", type: "tuple[]", components: sovereignStorageRefTuple.components },
    { ...sovereignStorageRefTuple, name: "systemPrompt" },
    { name: "model", type: "string" },
    { name: "tools", type: "string[]" },
    { name: "maxTurns", type: "uint16" },
    { name: "maxTokens", type: "uint32" },
    { name: "rpcUrls", type: "string" },
  ],
} as const;

const sovereignScheduleTuple = {
  name: "schedule",
  type: "tuple",
  components: [
    { name: "schedulerGas", type: "uint32" },
    { name: "frequency", type: "uint32" },
    { name: "schedulerTtl", type: "uint32" },
    { name: "maxFeePerGas", type: "uint256" },
    { name: "maxPriorityFeePerGas", type: "uint256" },
    { name: "value", type: "uint256" },
  ],
} as const;

const persistentLaunchScheduleTuple = {
  name: "schedule",
  type: "tuple",
  components: [
    { name: "schedulerGas", type: "uint32" },
    { name: "schedulerTtl", type: "uint32" },
    { name: "maxFeePerGas", type: "uint256" },
    { name: "maxPriorityFeePerGas", type: "uint256" },
    { name: "value", type: "uint256" },
  ],
} as const;

export const sovereignFactoryAbi = [
  {
    name: "predictCompressedHarness",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "userSalt", type: "bytes32" },
    ],
    outputs: [
      { name: "harness", type: "address" },
      { name: "compressedSalt", type: "bytes32" },
      { name: "childSalt", type: "bytes32" },
    ],
  },
  {
    name: "launchSovereignCompressed",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "userSalt", type: "bytes32" },
      { name: "executor", type: "address" },
      { name: "dkmsTtl", type: "uint64" },
      { name: "dkmsFunding", type: "uint256" },
      sovereignAgentParamsTuple,
      sovereignScheduleTuple,
      { name: "schedulerLockDuration", type: "uint256" },
      { name: "schedulerFunding", type: "uint256" },
      { name: "windowNumCalls", type: "uint32" },
    ],
    outputs: [
      { name: "harness", type: "address" },
      { name: "dkmsPaymentAddress", type: "address" },
      { name: "schedulerCallId", type: "uint256" },
    ],
  },
] as const;

export const persistentFactoryAbi = [
  {
    name: "predictCompressedLauncher",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "userSalt", type: "bytes32" },
    ],
    outputs: [
      { name: "launcher", type: "address" },
      { name: "compressedSalt", type: "bytes32" },
      { name: "childSalt", type: "bytes32" },
    ],
  },
  {
    name: "launchPersistentCompressed",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "userSalt", type: "bytes32" },
      { name: "executor", type: "address" },
      { name: "dkmsTtl", type: "uint64" },
      { name: "dkmsFunding", type: "uint256" },
      { name: "persistentInput", type: "bytes" },
      persistentLaunchScheduleTuple,
      { name: "schedulerLockDuration", type: "uint256" },
      { name: "schedulerFunding", type: "uint256" },
    ],
    outputs: [
      { name: "launcher", type: "address" },
      { name: "dkmsPaymentAddress", type: "address" },
      { name: "callId", type: "uint256" },
    ],
  },
] as const;

export const ragentControllerAbi = [
  {
    name: "CONTRACT_VERSION",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "computeAgentId",
    type: "function",
    stateMutability: "pure",
    inputs: [
      { name: "owner", type: "address" },
      { name: "userSalt", type: "bytes32" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "registerAgent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "userSalt", type: "bytes32" },
      { name: "agentType", type: "uint8" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      {
        name: "memoryRef",
        type: "tuple",
        components: [
          { name: "platform", type: "string" },
          { name: "path", type: "string" },
          { name: "keyRef", type: "string" },
        ],
      },
      {
        name: "outputRef",
        type: "tuple",
        components: [
          { name: "platform", type: "string" },
          { name: "path", type: "string" },
          { name: "keyRef", type: "string" },
        ],
      },
      { name: "secretsHash", type: "bytes32" },
    ],
    outputs: [{ name: "agentId", type: "bytes32" }],
  },
  {
    name: "updateStorage",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "bytes32" },
      {
        name: "memoryRef",
        type: "tuple",
        components: [
          { name: "platform", type: "string" },
          { name: "path", type: "string" },
          { name: "keyRef", type: "string" },
        ],
      },
      {
        name: "outputRef",
        type: "tuple",
        components: [
          { name: "platform", type: "string" },
          { name: "path", type: "string" },
          { name: "keyRef", type: "string" },
        ],
      },
    ],
    outputs: [],
  },
  {
    name: "updateSecretsHash",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "bytes32" },
      { name: "newHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "trackJob",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "agentId", type: "bytes32" },
      { name: "jobId", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "getAgent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "userSalt", type: "bytes32" },
          { name: "agentType", type: "uint8" },
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          {
            name: "memoryRef",
            type: "tuple",
            components: [
              { name: "platform", type: "string" },
              { name: "path", type: "string" },
              { name: "keyRef", type: "string" },
            ],
          },
          {
            name: "outputRef",
            type: "tuple",
            components: [
              { name: "platform", type: "string" },
              { name: "path", type: "string" },
              { name: "keyRef", type: "string" },
            ],
          },
          { name: "secretsHash", type: "bytes32" },
          { name: "active", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "getAgentCountByOwner",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getAgentIdByOwnerAt",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "getAgentIdsByOwner",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [{ type: "bytes32[]" }],
  },
  {
    name: "getAllAgentCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getAgentIdAt",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [{ type: "bytes32" }],
  },
  {
    name: "predictAgentChild",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "agentType", type: "uint8" },
      { name: "owner", type: "address" },
      { name: "userSalt", type: "bytes32" },
    ],
    outputs: [
      { name: "child", type: "address" },
      { name: "dkmsContext", type: "bytes32" },
    ],
  },
  {
    name: "AgentRegistered",
    type: "event",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "agentType", type: "uint8", indexed: true },
      { name: "userSalt", type: "bytes32", indexed: false },
      { name: "secretsHash", type: "bytes32", indexed: false },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false },
    ],
  },
  {
    name: "AgentJobTracked",
    type: "event",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true },
      { name: "jobId", type: "bytes32", indexed: true },
    ],
  },
  {
    name: "AgentResultDelivered",
    type: "event",
    inputs: [
      { name: "agentId", type: "bytes32", indexed: true },
      { name: "jobId", type: "bytes32", indexed: true },
      { name: "result", type: "bytes", indexed: false },
    ],
  },
] as const;

export const secretsAccessControlAbi = [
  {
    name: "grantAccess",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "delegate", type: "address" },
      { name: "secretsHash", type: "bytes32" },
      { name: "expiresAt", type: "uint256" },
      {
        name: "policy",
        type: "tuple",
        components: [
          { name: "allowedDestinations", type: "string[]" },
          { name: "allowedMethods", type: "string[]" },
          { name: "allowedPaths", type: "string[]" },
          { name: "allowedQueryParams", type: "string[]" },
          { name: "allowedHeaders", type: "string[]" },
          { name: "secretLocation", type: "string" },
          { name: "bodyFormat", type: "string" },
        ],
      },
    ],
    outputs: [],
  },
  {
    name: "revokeAccess",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "delegate", type: "address" },
      { name: "secretsHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "checkAccess",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "delegate", type: "address" },
      { name: "secretsHash", type: "bytes32" },
    ],
    outputs: [
      { name: "hasAccess", type: "bool" },
      {
        name: "policy",
        type: "tuple",
        components: [
          { name: "allowedDestinations", type: "string[]" },
          { name: "allowedMethods", type: "string[]" },
          { name: "allowedPaths", type: "string[]" },
          { name: "allowedQueryParams", type: "string[]" },
          { name: "allowedHeaders", type: "string[]" },
          { name: "secretLocation", type: "string" },
          { name: "bodyFormat", type: "string" },
        ],
      },
    ],
  },
  {
    name: "AccessGranted",
    type: "event",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "delegate", type: "address", indexed: true },
      { name: "secretsHash", type: "bytes32", indexed: true },
      { name: "expiresAt", type: "uint256", indexed: false },
    ],
  },
] as const;
