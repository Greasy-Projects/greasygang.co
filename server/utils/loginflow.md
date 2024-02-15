- Check if platform account is linked to user
    - if: 
        - return linked user id and create session (✅ done for twitch)
y
    - not: 
        - check if theres a user with same email
            - if: add platform account to users account link & create session
            - not: create user, create accountLink, create platform account, link platform account to accountLink
                    (✅ done for twitch)

## multi link oauth system
- user can link multiple oauth providers to their user account, but can only have one primary account connection

we would need:
- /link/twitch (GET) > callback
- /link/discord (GET) > callback
- /link/ (POST, DELETE, )
- /link/primary (POST)

- /link/twitch (GET)
    - check if platform is already linked to user
        ✅ already linked
        - merge accounts (?)
        ❌ not linked
        - create accountLink