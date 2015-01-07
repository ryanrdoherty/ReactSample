package com.mrfeelings.reactsample;

import java.util.HashSet;
import java.util.Set;

import javax.ws.rs.core.Application;

public class ServiceApplication extends Application {

  @Override
  public Set<Class<?>> getClasses() {
    Set<Class<?>> classes = new HashSet<>();
    classes.add(SampleService.class);
    return classes;
  }

}
