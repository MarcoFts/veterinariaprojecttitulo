# clinica/utils.py
def user_display_name(user):
    full = f"{user.first_name} {user.last_name}".strip()
    return full or user.email or user.username
