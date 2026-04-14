{
  lib,
  python3,
}:

python3.pkgs.buildPythonApplication rec {
  pname = "le-projet-de-vie";
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
    mkdir -p $out/share/le-projet-de-vie
    cp -r core adventure manage.py $out/share/le-projet-de-vie/
  '';

  doCheck = false;

  meta = with lib; {
    description = "L'aventure de l'Orientation - Manga-style educational platform";
    homepage = "https://github.com/mickours/le-projet-de-vie-web-site";
    license = licenses.mit;
  };
}
