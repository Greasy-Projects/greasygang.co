- Check if platform account is linked to user
    - if: 
        - return linked user id and create session (✅ done for twitch)
y
    - not: 
        - check if theres a user with same email
            - if: add platform account to users account link & create session
            - not: create user, create accountLink, create platform account, link platform account to accountLink
                    (✅ done for twitch)
