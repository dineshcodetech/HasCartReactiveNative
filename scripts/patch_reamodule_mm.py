import sys

file_path = 'node_modules/react-native-reanimated/apple/reanimated/apple/REAModule.mm'
with open(file_path, 'r') as f:
    lines = f.readlines()

with open(file_path, 'w') as f:
    for line in lines:
        # Patch synthesize
        if '@synthesize runtimeExecutor = _runtimeExecutor;' in line:
            f.write('#if REACT_NATIVE_MINOR_VERSION < 78\n')
            f.write(line)
            f.write('#endif\n')
        # Patch executor usage
        elif 'auto executorFunction = ([executor = _runtimeExecutor]' in line:
            f.write('#if REACT_NATIVE_MINOR_VERSION >= 78\n')
            f.write('    auto executorFunction = ([bridge = self.bridge](std::function<void(jsi::Runtime & runtime)> &&callback) {\n')
            f.write('      auto executor = RCTRuntimeExecutorFromBridge(bridge);\n')
            f.write('      executor(std::move(callback));\n')
            f.write('    });\n')
            f.write('#else\n')
            f.write(line)
        elif '[executor execute:^(jsi::Runtime &runtime) {' in line:
            f.write(line)
        elif 'callbackBlock(runtime);' in line and 'executor' in lines[lines.index(line)-1]:
             f.write(line)
        elif '};' in line and 'callbackBlock' in lines[lines.index(line)-2] and 'executor' in lines[lines.index(line)-3]:
             f.write(line)
             f.write('#endif\n')
        else:
            f.write(line)
