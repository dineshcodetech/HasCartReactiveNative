import sys

file_path = 'node_modules/react-native-reanimated/apple/reanimated/apple/REAModule.mm'
with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip_until = None

for i, line in enumerate(lines):
    if skip_until and skip_until not in line:
        continue
    if skip_until and skip_until in line:
        skip_until = None
        continue

    # 1. Fix the synthesize block - remove any existing mess and write a clean version
    if '@synthesize runtimeExecutor = _runtimeExecutor;' in line or '#if REACT_NATIVE_MINOR_VERSION < 78' in line and i < 100:
        if '@synthesize runtimeExecutor = _runtimeExecutor;' in line:
             new_lines.append('#if REACT_NATIVE_MINOR_VERSION < 78\n')
             new_lines.append('@synthesize runtimeExecutor = _runtimeExecutor;\n')
             new_lines.append('#endif\n')
        continue # Skip the old mess

    # 2. Fix the executorFunction block in installTurboModule
    if 'auto executorFunction = ([bridge = self.bridge]' in line or 'auto executorFunction = ([executor = _runtimeExecutor]' in line:
        new_lines.append('#if REACT_NATIVE_MINOR_VERSION >= 78\n')
        new_lines.append('    auto executorFunction = ([bridge = self.bridge](std::function<void(jsi::Runtime & runtime)> &&callback) {\n')
        new_lines.append('      auto executor = RCTRuntimeExecutorFromBridge(bridge);\n')
        new_lines.append('      executor(std::move(callback));\n')
        new_lines.append('    });\n')
        new_lines.append('#else\n')
        new_lines.append('    auto executorFunction = ([executor = _runtimeExecutor](std::function<void(jsi::Runtime & runtime)> &&callback) {\n')
        new_lines.append('      __block auto callbackBlock = callback;\n')
        new_lines.append('      [executor execute:^(jsi::Runtime &runtime) {\n')
        new_lines.append('        callbackBlock(runtime);\n')
        new_lines.append('      }];\n')
        new_lines.append('    });\n')
        new_lines.append('#endif\n')
        
        # Now we need to skip the old mess I wrote
        # Find where the old block ends (the next 'auto nativeReanimatedModule =')
        for j in range(i+1, len(lines)):
            if 'auto nativeReanimatedModule =' in lines[j]:
                skip_until = lines[j]
                new_lines.append(lines[j])
                break
        continue

    new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)
