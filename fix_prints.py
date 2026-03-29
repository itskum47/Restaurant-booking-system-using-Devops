import os
import re

directories = [
    'services/booking-service/app',
    'services/ai-service/app'
]

def replace_prints(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    if 'print(' not in content:
        return

    # A safer way to add import
    lines = content.split('\n')
    new_lines = []
    import_added = False
    
    for line in lines:
        new_lines.append(line)
        if not import_added and (line.startswith('import ') or line.startswith('from ')):
            # Wait until the last import? No, just add it here
            pass

    # Actually let's just prepend 
    if 'import structlog' not in content:
        # Find first non-empty, non-comment line that isn't a docstring?
        # A simple hack: just prepend to the file, it's usually fine
        content = "import structlog\nlogger = structlog.get_logger(__name__)\n\n" + content
        lines = content.split('\n')
    else:
        lines = content.split('\n')

    new_lines = []
    for line in lines:
        # Replace only if it's a direct print statement, roughly checking syntax
        if re.search(r'^\s*print\(', line):
            if 'Error' in line or 'Failed' in line or '❌' in line:
                line = re.sub(r'print\(', 'logger.error(', line, count=1)
            elif '⚠️' in line:
                line = re.sub(r'print\(', 'logger.warning(', line, count=1)
            else:
                line = re.sub(r'print\(', 'logger.info(', line, count=1)
        new_lines.append(line)

    with open(file_path, 'w') as f:
        f.write('\n'.join(new_lines))

for d in directories:
    if os.path.exists(d):
        for root, _, files in os.walk(d):
            for file in files:
                if file.endswith('.py') and file != 'logging_config.py':
                    replace_prints(os.path.join(root, file))

print("Replaced all prints with logger.")
