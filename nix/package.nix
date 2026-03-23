{
  lib,
  python3,
}:

python3.pkgs.buildPythonApplication rec {
  pname = "aventure-orientation";
  version = "0.1.0";
  format = "pyproject";

  srcs = [
    ../backend
    ../frontend
  ];

  sourceRoot = "backend";

  nativeBuildInputs = with python3.pkgs; [
    setuptools
    wheel
  ];

  propagatedBuildInputs = with python3.pkgs; [
    fastapi
    uvicorn
    gunicorn
    sqlalchemy
    pydantic
    pydantic-settings
    python-jose
    passlib
    bcrypt
    python-multipart
    pytest
    pytest-asyncio
    alembic
    httpx
    ruff
  ];

  # We want to include the frontend and backend in the package
  # The app expects frontend to be in a certain relative path
  postInstall = ''
    mkdir -p $out/share/aventure-orientation
    cp -r ../frontend $out/share/aventure-orientation/
    cp -r ../backend/src $out/share/aventure-orientation/backend-src
  '';

  doCheck = false;

  meta = with lib; {
    description = "L'aventure de l'Orientation - Manga-style educational platform";
    homepage = "https://github.com/mickours/monprojetdeviemelibr";
    license = licenses.mit;
  };
}
