# Tasks

## tasks

List tasks in the vault. Use `active` or `file`/`path` for a specific file.

```
file=<name>        # filter by file name
path=<path>        # filter by file path
status="<char>"    # filter by status character
total              # return task count
done               # show completed tasks
todo               # show incomplete tasks
verbose            # group by file with line numbers
format=json|tsv|csv  # output format (default: text)
active             # show tasks for active file
daily              # show tasks from daily note
```

**Examples:**
```shell
tasks                      # list all tasks
tasks todo                 # incomplete tasks only
tasks file=Recipe done     # completed tasks from specific file
tasks daily                # tasks from today's daily note
tasks daily total          # count tasks in daily note
tasks verbose              # with file paths and line numbers
tasks 'status=?'           # filter by custom status
```

## task

Show or update a task.

```
ref=<path:line>    # task reference (path:line)
file=<name>        # file name
path=<path>        # file path
line=<n>           # line number
status="<char>"    # set status character
toggle             # toggle task status
daily              # daily note
done               # mark as done
todo               # mark as todo
```

**Examples:**
```shell
task file=Recipe line=8              # show task info
task ref="Recipe.md:8"               # same, using ref
task ref="Recipe.md:8" toggle        # toggle completion
task daily line=3 toggle             # toggle daily note task
task file=Recipe line=8 done         # → [x]
task file=Recipe line=8 todo         # → [ ]
task file=Recipe line=8 status=-     # → [-]
task daily line=3 done               # mark daily task done
```
