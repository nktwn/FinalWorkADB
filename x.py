import os

def write_tree_and_py_content(root_dir, output_file):
    with open(output_file, "w", encoding="utf-8") as f:
        def walk(dir_path, prefix=""):
            items = sorted(os.listdir(dir_path))
            for i, item in enumerate(items):
                path = os.path.join(dir_path, item)

                if item == ".venv":
                    continue

                connector = "└── " if i == len(items) - 1 else "├── "
                f.write(prefix + connector + item + "\n")
                if os.path.isdir(path):
                    extension = "    " if i == len(items) - 1 else "│   "
                    walk(path, prefix + extension)

        f.write(f"{os.path.basename(root_dir)}\n")
        walk(root_dir)

        f.write("\n\n# Python and .env files content\n\n")
        for dirpath, _, filenames in os.walk(root_dir):
            if ".venv" in dirpath.split(os.sep):
                continue

            for filename in filenames:
                if filename.endswith(".py") or filename.endswith(".env"):
                    filepath = os.path.join(dirpath, filename)
                    relpath = os.path.relpath(filepath, root_dir)
                    f.write(f"\n--- {relpath} ---\n")
                    try:
                        with open(filepath, "r", encoding="utf-8") as pyf:
                            f.write(pyf.read())
                    except Exception as e:
                        f.write(f"\n[Ошибка чтения файла: {e}]\n")

if __name__ == "__main__":
    current_dir = os.getcwd()
    write_tree_and_py_content(current_dir, "project_structure.txt")
    print("Готово! Смотри файл project_structure.txt")