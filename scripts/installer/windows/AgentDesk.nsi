Unicode true
!include "MUI2.nsh"

!ifndef VERSION
  !define VERSION "0.0.0"
!endif
!define ROOT "..\..\.."

Name "AgentDesk"
OutFile "${ROOT}\dist\windows\AgentDesk-${VERSION}-windows-x64-setup.exe"
InstallDir "$LOCALAPPDATA\Programs\AgentDesk"
InstallDirRegKey HKCU "Software\AgentDesk" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma

!define MUI_ICON "${ROOT}\apps\codex-plus-manager\src-tauri\icons\icon.ico"
!define MUI_UNICON "${ROOT}\apps\codex-plus-manager\src-tauri\icons\icon.ico"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"

  nsExec::ExecToLog 'taskkill /IM codex-plus-plus.exe /F'
  Pop $0
  nsExec::ExecToLog 'taskkill /IM codex-plus-plus-manager.exe /F'
  Pop $0

  File "${ROOT}\dist\windows\app\codex-plus-plus.exe"
  File "${ROOT}\dist\windows\app\codex-plus-plus-manager.exe"

  Delete "$DESKTOP\AgentDesk 管理工具.lnk"
  Delete "$SMPROGRAMS\AgentDesk\AgentDesk 管理工具.lnk"

  CreateShortcut "$DESKTOP\AgentDesk.lnk" "$INSTDIR\codex-plus-plus.exe" "" "$INSTDIR\codex-plus-plus.exe"
  CreateShortcut "$DESKTOP\AgentDesk 管理工具.lnk" "$INSTDIR\codex-plus-plus-manager.exe" "" "$INSTDIR\codex-plus-plus-manager.exe"
  CreateDirectory "$SMPROGRAMS\AgentDesk"
  CreateShortcut "$SMPROGRAMS\AgentDesk\AgentDesk.lnk" "$INSTDIR\codex-plus-plus.exe" "" "$INSTDIR\codex-plus-plus.exe"
  CreateShortcut "$SMPROGRAMS\AgentDesk\AgentDesk 管理工具.lnk" "$INSTDIR\codex-plus-plus-manager.exe" "" "$INSTDIR\codex-plus-plus-manager.exe"
  CreateShortcut "$SMPROGRAMS\AgentDesk\卸载 AgentDesk.lnk" "$INSTDIR\uninstall.exe" "" "$INSTDIR\codex-plus-plus-manager.exe"

  WriteUninstaller "$INSTDIR\uninstall.exe"
  WriteRegStr HKCU "Software\AgentDesk" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AgentDesk" "DisplayName" "AgentDesk"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AgentDesk" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AgentDesk" "Publisher" "xxloocee"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AgentDesk" "DisplayIcon" "$INSTDIR\codex-plus-plus-manager.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AgentDesk" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AgentDesk" "UninstallString" "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  nsExec::ExecToLog 'taskkill /IM codex-plus-plus.exe /F'
  Pop $0
  nsExec::ExecToLog 'taskkill /IM codex-plus-plus-manager.exe /F'
  Pop $0

  Delete "$DESKTOP\AgentDesk.lnk"
  Delete "$DESKTOP\AgentDesk 管理工具.lnk"
  Delete "$SMPROGRAMS\AgentDesk\AgentDesk.lnk"
  Delete "$SMPROGRAMS\AgentDesk\AgentDesk 管理工具.lnk"
  Delete "$SMPROGRAMS\AgentDesk\卸载 AgentDesk.lnk"
  RMDir "$SMPROGRAMS\AgentDesk"

  Delete "$INSTDIR\codex-plus-plus.exe"
  Delete "$INSTDIR\codex-plus-plus-manager.exe"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"

  ReadRegStr $0 HKCU "Software\Classes\codexplusplus\shell\open\command" ""
  StrCpy $1 "$\"$INSTDIR\codex-plus-plus-manager.exe$\" $\"%1$\""
  StrCmp $0 $1 0 +2
  DeleteRegKey HKCU "Software\Classes\codexplusplus"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\AgentDesk"
  DeleteRegKey HKCU "Software\AgentDesk"
SectionEnd
