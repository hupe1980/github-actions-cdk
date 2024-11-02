def handler(event, _):
    greeting = f"Hello {event['name']}!"
    print(greeting)
    return {"greeting" : greeting}