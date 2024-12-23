# Change the contract address and name if needed

forge verify-contract  \
    --verifier blockscout  \
    --verifier-url https://blockscout.taurus.autonomys.xyz/api/ -e ""  \
    --evm-version london --chain 490000 --compiler-version 0.8.28  \
    --watch  \
    0xc1afebe677badb71fc760e61479227e43b422e48  \
    DeployScript