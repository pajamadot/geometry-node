import yaml

def parse_yaml_to_dict(content: str) -> dict | None:
  content = content.strip()

  if content.startswith("```yaml"):
      content = content[7:].strip()
  elif content.startswith("```yml"):
      content = content[6:].strip()
  
  if content.endswith("```"):
      content = content[:-3].strip()

  yaml_content = content.replace("\\n", "\n")

  try:
    return yaml.safe_load(yaml_content)
  except yaml.YAMLError:
    return None