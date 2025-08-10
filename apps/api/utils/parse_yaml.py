import yaml

def parse_yaml_to_dict(content: str) -> dict | None:
  yaml_content = ""
  if "```yaml" in content:
    yaml_blocks = content.split("```yaml")
    if len(yaml_blocks) > 1:
      yaml_content = yaml_blocks[1].split("```")[0].strip()
  elif "```yml" in content:
    yaml_blocks = content.split("```yml")
    if len(yaml_blocks) > 1:
      yaml_content = yaml_blocks[1].split("```")[0].strip()
  elif "```" in content:
    yaml_blocks = content.split("```")
    if len(yaml_blocks) > 1:
      yaml_content = yaml_blocks[1].strip()
  else:
    yaml_content = content.strip()

  yaml_content = yaml_content.replace("\\n", "\n")

  try:
    res_dict = yaml.safe_load(yaml_content)
    return res_dict
  except yaml.YAMLError:
    return None