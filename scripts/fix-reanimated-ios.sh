#!/bin/bash
FILE="node_modules/react-native-reanimated/apple/reanimated/apple/REAModule.h"
if [ -f "$FILE" ]; then
  echo "Patching $FILE..."
  # Fix RCTRuntimeExecutorModule.h
  sed -i '' 's/#import <React\/RCTRuntimeExecutorModule.h>/#if REACT_NATIVE_MINOR_VERSION < 78\n#import <React\/RCTRuntimeExecutorModule.h>\n#endif/g' "$FILE"
  
  # Fix RCTRuntimeExecutor.h -> RuntimeExecutor.h
  sed -i '' 's/#import <ReactCommon\/RCTRuntimeExecutor.h>/#if REACT_NATIVE_MINOR_VERSION >= 78\n#import <ReactCommon\/RuntimeExecutor.h>\n#else\n#import <ReactCommon\/RCTRuntimeExecutor.h>\n#endif/g' "$FILE"
  
  # Fix the protocol implementation
  # Using a unique marker to avoid double-patching if script runs twice
  if ! grep -q "Patching protocol for 78" "$FILE"; then
    sed -i '' '/RCTRuntimeExecutorModule,/i\
                        // Patching protocol for 78
    ' "$FILE"
    sed -i '' 's/RCTRuntimeExecutorModule,/#if REACT_NATIVE_MINOR_VERSION < 78\n                        RCTRuntimeExecutorModule,\n#endif/g' "$FILE"
  fi
fi

MM_FILE="node_modules/react-native-reanimated/apple/reanimated/apple/REAModule.mm"
if [ -f "$MM_FILE" ]; then
  echo "Patching $MM_FILE..."
  # For 0.78, we might need to use RuntimeExecutor instead of RCTRuntimeExecutor in some places if they are explicit
  # But usually it's just a typecast.
  sed -i '' 's/RCTRuntimeExecutorModule/RCTBridgeModule/g' "$MM_FILE"
fi
echo "Done."
