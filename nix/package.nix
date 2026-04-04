{
  lib,
  python3,
}:

python3.pkgs.buildPythonApplication rec {
  pname = "mon-projet-de-vie";
  version = "0.1.0";
  format = "pyproject";

  srcs = [
    ../backend
  ];

  sourceRoot = "backend";

  nativeBuildInputs = with python3.pkgs; [
    setuptools
    wheel
  ];

  propagatedBuildInputs = with python3.pkgs; [
    django
    django-stubs
    gunicorn
    pytest
    pytest-django
    mypy
    ruff
    whitenoise
  ];

  # We want to include the backend in the package
  postInstall = ''
    mkdir -p $out/share/mon-projet-de-vie
    cp -r core adventure manage.py $out/share/mon-projet-de-vie/
  '';

  doCheck = false;

  meta = with lib; {
    description = "L'aventure de l'Orientation - Manga-style educational platform";
    homepage = "https://github.com/mickours/monprojetdeviemelibr";
    license = licenses.mit;
  };
}
