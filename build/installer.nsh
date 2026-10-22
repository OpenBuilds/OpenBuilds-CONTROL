!include nsDialogs.nsh
!include FileAssociation.nsh

!macro customPageAfterChangeDir
  Var GcCheckbox
  Var GcCheckbox_State
  Var CamCheckbox
  Var CamCheckbox_State

  Function customShowPage
    ; 1. Create the dialog layout frame
    nsDialogs::Create 1018
    Pop $0
    ${If} $0 == error
      Abort
    ${EndIf}

    !insertmacro MUI_HEADER_TEXT "Additional Options" "Choose optional settings for your installation."

    ${NSD_CreateLabel} 0 0 100% 12u "Select the file extensions to associate with Groove Control"
    Pop $0

    ${NSD_CreateCheckbox} 5 15u 100% 10u "G-code files (*.nc, *.gc, *.gcode, *.tap, *.cnc)"
    Pop $GcCheckbox

    ${NSD_CreateCheckbox} 5 30u 100% 10u "OpenBuilds CAM projects (*.obc)"
    Pop $CamCheckbox

    ${If} $GcCheckbox_State == ""
      StrCpy $GcCheckbox_State ${BST_CHECKED}
    ${EndIf}

    ${If} $CamCheckbox_State == ""
      StrCpy $CamCheckbox_State ${BST_CHECKED}
    ${EndIf}

    ${NSD_SetState} $GcCheckbox $GcCheckbox_State
    ${NSD_SetState} $CamCheckbox $CamCheckbox_State
    nsDialogs::Show
  FunctionEnd

  Function customLeavePage
    ${NSD_GetState} $GcCheckbox $GcCheckbox_State
    ${NSD_GetState} $CamCheckbox $CamCheckbox_State
  FunctionEnd

  Page custom customShowPage customLeavePage
!macroend

!macro customInstall
  ${If} $GcCheckbox_State == ${BST_CHECKED}
    !insertmacro APP_ASSOCIATE "gcode" "G-code File" "G-code File" "$appExe,0" "Open with GrooveControl" "$appExe $\"%1$\""
    !insertmacro APP_ASSOCIATE "gc" "G-code File" "G-code File" "$appExe,0" "Open with GrooveControl" "$appExe $\"%1$\""
    !insertmacro APP_ASSOCIATE "tap" "G-code File" "G-code File" "$appExe,0" "Open with GrooveControl" "$appExe $\"%1$\""
    !insertmacro APP_ASSOCIATE "nc" "G-code File" "G-code File" "$appExe,0" "Open with GrooveControl" "$appExe $\"%1$\""
    !insertmacro APP_ASSOCIATE "cnc" "G-code File" "G-code File" "$appExe,0" "Open with GrooveControl" "$appExe $\"%1$\""
  ${EndIf}
  ${If} $CamCheckbox_State == ${BST_CHECKED}
    !insertmacro APP_ASSOCIATE "obc" "OpenBuilds CAM Project" "OpenBuilds CAM Project" "$appExe,0" "Open with GrooveControl" "$appExe $\"%1$\""
  ${EndIf}
!macroend

!macro customUnInstall
  !insertmacro APP_UNASSOCIATE "gcode" "G-code File"
  !insertmacro APP_UNASSOCIATE "gc" "G-code File"
  !insertmacro APP_UNASSOCIATE "tap" "G-code File"
  !insertmacro APP_UNASSOCIATE "nc" "G-code File"
  !insertmacro APP_UNASSOCIATE "cnc" "G-code File"
  !insertmacro APP_UNASSOCIATE "obc" "OpenBuilds CAM Project"
!macroend
