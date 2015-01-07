package com.mrfeelings.reactsample;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class JsonType {

  public static enum NativeType {
    OBJECT, ARRAY
  }

  private NativeType _nativeType;
  private JSONObject _jsonObject;
  private JSONArray _jsonArray;
  
  public JsonType(String jsonStr) throws JSONException {
    try {
      _jsonObject = new JSONObject(jsonStr);
      _nativeType = NativeType.OBJECT;
    }
    catch (JSONException e1) {
      try {
        _jsonArray = new JSONArray(jsonStr);
        _nativeType = NativeType.ARRAY;
      }
      catch (JSONException e2) {
        // more likely trying to parse JSON object
        throw e1;
      }
    }
  }

  public JsonType(JSONObject jsonObject) {
    _jsonObject = jsonObject;
    _nativeType = NativeType.OBJECT;
  }

  public JsonType(JSONArray jsonArray) {
    _jsonArray = jsonArray;
    _nativeType = NativeType.ARRAY;
  }

  public NativeType getNativeType() {
    return _nativeType;
  }

  public JSONObject getObject() {
    return _jsonObject;
  }

  public JSONArray getArray() {
    return _jsonArray;
  }

  @Override
  public String toString() {
    switch (_nativeType) {
      case OBJECT: return _jsonObject.toString();
      case ARRAY:  return _jsonArray.toString();
      default:     return null; // should never happen
    }
  }

  public Object getNativeObject() {
    switch (_nativeType) {
      case OBJECT: return _jsonObject;
      case ARRAY:  return _jsonArray;
      default:     return null; // should never happen
    }
  }
}
