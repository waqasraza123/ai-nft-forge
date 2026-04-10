import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

import solc from "solc";

import { aiNftForgeCollectionContractName } from "./index.js";

type SolcCompilationArtifact = {
  abi: unknown[];
  evm?: {
    bytecode?: {
      object?: string;
    };
  };
};

type SolcCompilationOutput = {
  contracts?: Record<
    string,
    Record<string, SolcCompilationArtifact | undefined> | undefined
  >;
  errors?: Array<{
    formattedMessage?: string;
    message: string;
    severity: "error" | "warning";
  }>;
};

export type CollectionContractArtifact = {
  abi: unknown[];
  bytecode: `0x${string}`;
  contractName: string;
  source: string;
};

const collectionContractSource = `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AiNftForgeCollection is ERC721, Ownable {
  string private _baseTokenUri;

  constructor(
    string memory name_,
    string memory symbol_,
    address owner_,
    string memory baseTokenUri_
  ) ERC721(name_, symbol_) Ownable(owner_) {
    _baseTokenUri = baseTokenUri_;
  }

  function ownerMint(address to, uint256 tokenId) external onlyOwner {
    _safeMint(to, tokenId);
  }

  function baseTokenUri() external view returns (string memory) {
    return _baseTokenUri;
  }

  function _baseURI() internal view override returns (string memory) {
    return _baseTokenUri;
  }
}
`;

let cachedCollectionContractArtifact: CollectionContractArtifact | null = null;

function loadOpenZeppelinImport(importPath: string) {
  const require = createRequire(import.meta.url);
  const openZeppelinPackageRoot = dirname(
    require.resolve("@openzeppelin/contracts/package.json")
  );
  const relativeImportPath = importPath.replace(
    /^@openzeppelin\/contracts\//,
    ""
  );
  const resolvedImportPath = join(openZeppelinPackageRoot, relativeImportPath);

  return readFileSync(resolvedImportPath, "utf8");
}

function compileCollectionContractArtifact(): CollectionContractArtifact {
  const input = {
    language: "Solidity",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"]
        }
      }
    },
    sources: {
      "AiNftForgeCollection.sol": {
        content: collectionContractSource
      }
    }
  };

  const output = JSON.parse(
    solc.compile(JSON.stringify(input), {
      import: (importPath: string) => {
        if (importPath.startsWith("@openzeppelin/contracts/")) {
          return {
            contents: loadOpenZeppelinImport(importPath)
          };
        }

        return {
          error: `Unsupported import path: ${importPath}`
        };
      }
    })
  ) as SolcCompilationOutput;

  const fatalErrors =
    output.errors?.filter((entry) => entry.severity === "error") ?? [];

  if (fatalErrors.length > 0) {
    throw new Error(
      fatalErrors
        .map((entry) => entry.formattedMessage ?? entry.message)
        .join("\n\n")
    );
  }

  const compiledContract =
    output.contracts?.["AiNftForgeCollection.sol"]?.[
      aiNftForgeCollectionContractName
    ];

  const bytecodeObject = compiledContract?.evm?.bytecode?.object;

  if (!compiledContract?.abi || !bytecodeObject) {
    throw new Error("The ERC-721 collection contract could not be compiled.");
  }

  return {
    abi: compiledContract.abi,
    bytecode: `0x${bytecodeObject}` as `0x${string}`,
    contractName: aiNftForgeCollectionContractName,
    source: collectionContractSource
  };
}

export function getAiNftForgeCollectionContractArtifact() {
  if (!cachedCollectionContractArtifact) {
    cachedCollectionContractArtifact = compileCollectionContractArtifact();
  }

  return cachedCollectionContractArtifact;
}
