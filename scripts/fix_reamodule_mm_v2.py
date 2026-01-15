import sys
import re

file_path = 'node_modules/react-native-reanimated/apple/reanimated/apple/REAModule.mm'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Fix the synthesize block
# Remove any existing patches first to be clean
content = re.sub(r'#if REACT_NATIVE_MINOR_VERSION < 78\s+@synthesize runtimeExecutor = _runtimeExecutor;\s+#endif', '@synthesize runtimeExecutor = _runtimeExecutor;', content)
# Now apply it correctly
content = content.replace('@synthesize runtimeExecutor = _runtimeExecutor;', '#if REACT_NATIVE_MINOR_VERSION < 78\n@synthesize runtimeExecutor = _runtimeExecutor;\n#endif')

# 2. Fix the executorFunction block in installTurboModule
# We look for the bridgeless block.
# We'll replace the problematic area with a clean one.

# First, let's find the start of the Bridgeless block
bridgeless_pattern = r'(if \(_isBridgeless\) \{\s+#if REACT_NATIVE_MINOR_VERSION >= 74 && defined\(RCT_NEW_ARCH_ENABLED\)\s+RCTCxxBridge \*cxxBridge = \(RCTCxxBridge \*\)self\.bridge;\s+auto &rnRuntime = \*\(jsi::Runtime \*\)cxxBridge\.runtime;)(.*?)(auto nativeReanimatedModule = reanimated::createReanimatedModuleBridgeless\(.*?executorFunction\);)'

# The middle part is what we want to replace.
# I will define a clean search and replace for the middle part.

new_executor_block = """
#if REACT_NATIVE_MINOR_VERSION >= 78
    auto executorFunction = ([bridge = self.bridge](std::function<void(jsi::Runtime & runtime)> &&callback) {
      auto executor = RCTRuntimeExecutorFromBridge(bridge);
      executor(std::move(callback));
    });
#else
    auto executorFunction = ([executor = _runtimeExecutor](std::function<void(jsi::Runtime & runtime)> &&callback) {
      // Convert to Objective-C block so it can be captured properly.
      __block auto callbackBlock = callback;

      [executor execute:^(jsi::Runtime &runtime) {
        callbackBlock(runtime);
      }];
    });
#endif
    """

# I'll use a more direct replacement for the faulty code I introduced.
# My previous script introduced:
# #if REACT_NATIVE_MINOR_VERSION >= 78
#     auto executorFunction = ...
# #else
#     auto executorFunction = ...
#     });
#     auto nativeReanimatedModule = ...

# I will just regex find the mess I made and fix it.
faulty_pattern = r'#if REACT_NATIVE_MINOR_VERSION >= 78\s+auto executorFunction = \(\[bridge = self\.bridge\]\(std::function<void\(jsi::Runtime & runtime\)> &&callback\) \{\s+auto executor = RCTRuntimeExecutorFromBridge\(bridge\);\s+executor\(std::move\(callback\)\);\s+@?\}\);\s+#else\s+auto executorFunction = \(\[executor = _runtimeExecutor\]\(std::function<void\(jsi::Runtime & runtime\)> &&callback\) \{\s+// Convert to Objective-C block so it can be captured properly\.\s+__block auto callbackBlock = callback;\s+\[executor execute:\^\(jsi::Runtime &runtime\) \{\s+callbackBlock\(runtime\);\s+@?\}\];\s+@?\}\);'

content = re.sub(faulty_pattern, new_executor_block, content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)
