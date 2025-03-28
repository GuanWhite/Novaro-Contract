Tasks Overview

1. Deploy Novaro Protocol

Run the following command to deploy the Novaro protocol on the specified network:

npx hardhat deploy-novaro --network <network_name>

	•	Replace <network_name> with the target network (e.g., hardhat, sepolia, etc.).

2. Update Token Address

This task updates the token addresses in the Community’s underlying contract.

Command syntax:

npx hardhat updateTokenAddress --provider-address <provider_address>

	•	Replace <provider_address> with the deployed TokenAddressProvider contract address.

Example:

npx hardhat updateTokenAddress --provider-address 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853

This will update all token addresses specified in the JSON configuration file.
